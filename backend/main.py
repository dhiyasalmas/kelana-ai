import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from services.trip_service import (
    calculate_budget,
    get_trip_category,
    recomendation_destination,
    get_travel_season
)
from services.bedrock_service import get_ai_recommendation
from models.trip import Trip
from database import SessionLocal, init_db

# Memuat variabel environment dari file .env
load_dotenv()

# 1. Inisialisasi Aplikasi terlebih dahulu
app = FastAPI()

# Mengambil nilai FRONTEND_URL dari .env (gunakan default localhost:3000 jika tidak ada)
frontend_url = os.getenv("FRONTEND_URL")

# 2. Tambahkan Middleware CORS agar Next.js bisa mengambil data
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],    # Mengizinkan request dari semua URL (localhost maupun IP jaringan)
    allow_credentials=True,
    allow_methods=["*"],    # Mengizinkan semua method (GET, POST, PUT, DELETE)
    allow_headers=["*"],    # Mengizinkan semua header
)

# 3. Pydantic Models
class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    hotel_cost: float
    transportation_cost: float
    food_cost: float
    travel_month: str 
    travel_style: str

class TripUpdateBudget(BaseModel):
    budget: float
    hotel_cost: float
    transportation_cost: float
    food_cost: float

# 4. Inisialisasi Database
init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ENDPOINTS ---

# GET Root
@app.get("/")
def home():
    return {"message": "Welcome to KelanaAI"}

# GET Health Check
@app.get("/health")
def health():
    return {"status": "OK"}

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
def create_trip(request: TripRequest, db: Session = Depends(get_db)):
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
        destination=request.destination,
        budget=budget_perday,
        travel_style=f"{request.travel_style} Travel, {category} Budget",

    )

    # Simpan ke Database
    trip = Trip(
        destination=request.destination,
        days=request.days,
        budget=request.budget,
        hotel_cost=request.hotel_cost,
        transportation_cost=request.transportation_cost,
        food_cost=request.food_cost,
        travel_month=request.travel_month,
        travel_style=request.travel_style,
        category=category,
        daily_budget=budget_perday,
        vehicle=vehicle,
        season=season,
        total_estimated_cost=total_estimated_cost,
        rest_budget=rest_budget,
        ai_recommendation=ai_itinerary 
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)
    
    # Format response manual agar mudah dirender oleh Next.js
    return {
        "message": "Trip beserta rekomendasi AI berhasil disimpan!",
        "trip_data": {
            "destination": trip.destination,
            "category": trip.category,
            "season": trip.season,
            "ai_recommendation": trip.ai_recommendation
        }
    }

# PUT Update Budget
@app.put("/api/v1/trips/{trip_id}")
def update_trip_budget(trip_id: int, request: TripUpdateBudget, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip.budget = request.budget
    
    # Hitung ulang budget
    budget_perday, _, _ = calculate_budget(
        days=trip.days, 
        budget=request.budget, 
        hotel_cost=request.hotel_cost, 
        transportation_cost=request.transportation_cost, 
        food_cost=request.food_cost
    )
    
    # Hitung ulang kategori
    category, vehicle = get_trip_category(request.budget)
    trip.daily_budget = budget_perday
    trip.category = category
    
    db.commit()
    db.refresh(trip)
    
    return {
        "message": "Trip budget berhasil diperbarui!",
        "trip_data": {
            "destination": trip.destination,
            "category": trip.category,
            "season": trip.season,
            "ai_recommendation": trip.ai_recommendation
        }
    }

# --- TAMBAHKAN KODE INI DI MAIN.PY ---

# GET All Trips (Untuk halaman daftar trip)
@app.get("/api/v1/trips")
def get_all_trips(db: Session = Depends(get_db)):
    # Mengambil semua trip, diurutkan dari yang terbaru (descending)
    trips = db.query(Trip).order_by(Trip.id.desc()).all()
    return trips

# GET Single Trip (Untuk halaman detail trip)
@app.get("/api/v1/trips/{trip_id}")
def get_single_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

# DELETE Trip
@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    db.delete(trip)
    db.commit()
    return {"message": f"Trip dengan ID {trip_id} berhasil dihapus"}