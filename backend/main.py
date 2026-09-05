import os
import boto3
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
#from services.auth_service import SECRET_KEY, ALGORITHM
from models.user import User
from services.trip_service import (
    calculate_budget,
    get_trip_category,
    recomendation_destination,
    get_travel_season
)
from services.auth_service import login_user_service, register_user
from services.bedrock_service import get_ai_recommendation
from models.trip import Trip
from database import SessionLocal, init_db
from models.conversation import Conversation, Message
from services.kb_service import retrieve_and_generate

# Memuat variabel environment dari file .env
load_dotenv()

# 1. Inisialisasi Aplikasi terlebih dahulu
app = FastAPI()

# Mengambil nilai dari .env
frontend_url = os.getenv("FRONTEND_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

# 2. Tambahkan Middleware CORS agar Next.js bisa mengambil data
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_url,
    allow_credentials=True,
    allow_methods=["*"],    # Mengizinkan semua method (GET, POST, PUT, DELETE)
    allow_headers=["*"],    # Mengizinkan semua header
)

# 3. Pydantic Models
class TripRequest(BaseModel):
    destination: str
    origin: str
    days: int
    budget: float
    hotel_cost: float
    transportation_cost: float
    food_cost: float
    travel_month: str 
    travel_year: int
    travel_style: str

    @field_validator("days")
    @classmethod
    def days_must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Jumlah hari harus lebih dari 0")
        return v

    @field_validator("budget")
    @classmethod
    def budget_max_limit(cls, v: float) -> float:
        if v > 1_000_000_000:
            raise ValueError("Budget maksimal adalah 1 miliar")
        return v

class TripUpdateBudget(BaseModel):
    budget: float
    hotel_cost: float
    transportation_cost: float
    food_cost: float

class RegisterRequest(BaseModel):
    name:     str
    email:    str
    password: str

    @field_validator("email")
    @classmethod
    def email_must_contain_at(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v.lower().strip()

class LoginRequest(BaseModel):
    email: str
    password: str

class QuestionRequest(BaseModel):
    question: str

class MessageCreate(BaseModel):
    content: str

class ConversationCreate(BaseModel):
    title: str = "New Chat"

# 4. Inisialisasi Database
init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Memberitahu FastAPI dari mana asalnya token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Akses ditolak: Token tidak valid atau sudah kedaluwarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Bongkar token JWT untuk mendapatkan user ID ("sub")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Cari user di database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

# --- ENDPOINTS ---

# GET Root
@app.get("/")
def home():
    return {"message": "Welcome to KelanaAI"}

# GET Health Check
@app.get("/health")
def health():
    return {"status": "OK"}

# POST endpoint — register a new user
@app.post("/api/v1/auth/register", status_code=201)
def register(request: RegisterRequest):
    db = SessionLocal()
    try:
        user = register_user(
            db       = db,
            name     = request.name,
            email    = request.email,
            password = request.password,
        )
        return {
            "id":         user.id,
            "name":       user.name,
            "email":      user.email,
            "created_at": user.created_at,
        }
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    finally:
        db.close()

@app.post("/api/v1/auth/login")
def login(request: LoginRequest):
    db = SessionLocal()
    try:
        # Memanggil fungsi login_user_service yang kita buat di auth_service.py
        token = login_user_service(
            db=db, 
            email=request.email, 
            password=request.password
        )
        return {
            "access_token": token,
            "token_type": "bearer"
        }
    finally:
        db.close()

# GET Recommendations
@app.get("/api/v1/recommendations/{country}")
def get_destinations(country: str):
    places = recomendation_destination(country)
    return {
        "country": country,
        "recommended_places": places
    }

# POST Create Trip
@app.post("/api/v1/trips")
def create_trip(request: TripRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    budget_perday, total_estimated_cost, rest_budget = calculate_budget(
        days=request.days, 
        budget=request.budget, 
        hotel_cost=request.hotel_cost, 
        transportation_cost=request.transportation_cost, 
        food_cost=request.food_cost
    )
    
    # Dapatkan kategori (travel style) dan musim
    category, vehicle = get_trip_category(daily_budget=budget_perday, currency="IDR")
    season = get_travel_season(request.travel_month)

    # Panggil AI Recommendation dari AWS Bedrock
    ai_itinerary = get_ai_recommendation(
        days=request.days,
        origin=request.origin,
        destination=request.destination,
        budget=budget_perday,
        travel_style=f"{request.travel_style} Travel, {category} Budget",
        travel_year=request.travel_year,
    )

    # Simpan ke Database
    trip = Trip(
        destination=request.destination,
        origin=request.origin,
        days=request.days,
        budget=request.budget,
        hotel_cost=request.hotel_cost,
        transportation_cost=request.transportation_cost,
        food_cost=request.food_cost,
        travel_month=request.travel_month,
        travel_year=request.travel_year,
        travel_style=request.travel_style,
        category=category,
        daily_budget=budget_perday,
        vehicle=vehicle,
        season=season,
        total_estimated_cost=total_estimated_cost,
        rest_budget=rest_budget,
        ai_recommendation=ai_itinerary,
        user_id=current_user.id
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)

    return {"message": "Success", "trip_data": trip}

# Knowledge Base
@app.post("/api/v1/ask")
def ask(request: QuestionRequest, current_user: User = Depends(get_current_user)):
    try:
        # retrieve_and_generate sekarang menghasilkan dict: {"answer": "...", "sources": [...]}
        result = retrieve_and_generate(request.question)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Kembalikan jawaban dan sumber dokumen ke frontend
    return {
        "question": request.question, 
        "answer": result["answer"],
        "sources": result["sources"]
    }

# Base Model
@app.post("/api/v1/ask-base-model")
def ask_base_model(request: QuestionRequest, current_user: User = Depends(get_current_user)):
    """
    Endpoint ini HANYA digunakan untuk testing dan perbandingan.
    Ia TIDAK membaca Knowledge Base (dokumen). Ia hanya bertanya 
    langsung ke otak dasar AI (Base Model).
    """
    
    # Ambil region dari .env, default ke ap-southeast-2 (konsisten dengan bedrock_service)
    region = os.getenv("AWS_REGION", "ap-southeast-2")
    
    # Gunakan model yang sama dengan KB Service agar perbandingannya adil
    model_id = "amazon.nova-lite-v1:0"
    
    llm_client = boto3.client(
        service_name="bedrock-runtime",
        region_name=region
    )
    
    # Prompt sederhana tanpa disisipi konteks dokumen
    prompt = f"""
    Anda adalah asisten AI. Jawablah pertanyaan berikut dengan sebaik-baiknya.
    
    Pertanyaan: "{request.question}"
    """
    
    try:
        response = llm_client.converse(
            modelId=model_id,
            messages=[{
                "role": "user",
                "content": [{"text": prompt}]
            }]
        )
        answer = response['output']['message']['content'][0]['text']
    except Exception as e:
        answer = f"Error saat memanggil Base Model: {e}"
        
    return {
        "question": request.question,
        "answer": answer
    }

@app.get("/api/v1/auth/me")
def get_user_profile(current_user: User = Depends(get_current_user)):
    # Mengembalikan data user yang sedang login (kecuali password)
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email
    }

# GET Trips (Untuk halaman daftar trip)
@app.get("/api/v1/trips")
def get_trips(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Filter data berdasarkan user_id milik pengguna yang sedang login
    trips = db.query(Trip).filter(Trip.user_id == current_user.id).order_by(Trip.id.desc()).all()
    return trips

# GET Single Trip (Untuk halaman detail trip)
@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip tidak ditemukan")
    
    # PROTEKSI 403: Cegah orang melihat detail trip orang lain
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: Kamu tidak berhak melihat trip ini")
        
    return trip

@app.put("/api/v1/trips/{trip_id}")
def update_trip(trip_id: int, request: TripUpdateBudget, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip tidak ditemukan")
    
    # PROTEKSI 403: Tolak update jika trip bukan milik user login
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: Kamu tidak berhak mengubah trip milik orang lain")
        
    # KOREKSI: Tambahkan field lainnya agar ter-update di database
    trip.budget = request.budget
    trip.hotel_cost = request.hotel_cost
    trip.transportation_cost = request.transportation_cost
    trip.food_cost = request.food_cost
    
    db.commit()
    db.refresh(trip)
    return trip

# --- ENDPOINTS CONVERSATION ---

# 1. Mengambil semua daftar obrolan di sidebar kiri
@app.get("/api/v1/conversations")
def get_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversations = db.query(Conversation).filter(Conversation.user_id == current_user.id).order_by(Conversation.created_at.desc()).all()
    return conversations

# 2. Membuat obrolan baru (Tombol "New Chat")
@app.post("/api/v1/conversations")
def create_conversation(request: ConversationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_conv = Conversation(user_id=current_user.id, title=request.title)
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)
    return new_conv

# 3. Mengirim pesan ke obrolan tertentu (Membaca memori + Menyimpan ke DB)
@app.post("/api/v1/conversations/{conv_id}/messages")
def send_message(conv_id: int, request: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Pastikan obrolan ini milik user yang sedang login
    conv = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 2. Simpan pesan User ke Database terlebih dahulu
    user_msg = Message(conversation_id=conv_id, role="user", content=request.content)
    db.add(user_msg)
    db.commit()

    # 3. AMBIL MEMORI DARI DATABASE
    # Tarik semua pesan dalam obrolan ini dari awal sampai akhir secara berurutan
    history = db.query(Message).filter(Message.conversation_id == conv_id).order_by(Message.created_at.asc()).all()
    
    # PENTING: Kita memisahkan pesan historis dengan pesan terbaru
    # Ambil semua pesan kecuali pesan terakhir (yang baru saja disave di langkah 2)
    chat_history = history[:-1] if len(history) > 1 else []

    # 4. PANGGIL AI (RAG) DAN BERIKAN MEMORINYA
    try:
        # Perhatikan parameter chat_history=chat_history diselipkan di sini!
        result = retrieve_and_generate(request.content, chat_history=chat_history)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 5. Simpan jawaban AI ke Database
    ai_msg = Message(
        conversation_id=conv_id, 
        role="assistant", 
        content=result["answer"],
        sources=result["sources"]
    )
    db.add(ai_msg)
    
    # 6. Update judul chat otomatis (hanya jika ini pesan pertama)
    if len(history) == 1 and conv.title == "New Chat":
        # Ambil maksimal 30 huruf pertama untuk judul di sidebar
        conv.title = request.content[:30] + "..." 
    
    db.commit()

    # Kembalikan jawaban ke frontend
    return {
        "question": request.content,
        "answer": result["answer"],
        "sources": result["sources"]
    }

# 4. Mengambil riwayat pesan untuk ditampilkan di layar tengah
@app.get("/api/v1/conversations/{conv_id}/messages")
def get_messages(conv_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    messages = db.query(Message).filter(Message.conversation_id == conv_id).order_by(Message.created_at.asc()).all()
    return messages

@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip tidak ditemukan")
        
    # PROTEKSI 403: Tolak penghapusan jika trip bukan milik user login
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: Kamu tidak berhak menghapus trip milik orang lain")
        
    db.delete(trip)
    db.commit()
    return {"message": f"Trip dengan ID {trip_id} berhasil dihapus"}