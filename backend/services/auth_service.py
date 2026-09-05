import os
import bcrypt
from sqlalchemy.orm import Session
from models.user import User
from jose import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException
from dotenv import load_dotenv

# Memuat variabel environment dari file .env
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt. Returns the hash as a UTF-8 string."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if plain_password matches the stored bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def register_user(db: Session, name: str, email: str, password: str) -> User:
    """
    Create and persist a new User.

    Raises ValueError if the email is already taken.
    The caller is responsible for managing the session lifecycle.
    """
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise ValueError("Email already registered")

    user = User(
        name          = name,
        email         = email,
        password_hash = hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def login_user_service(db: Session, email: str, password: str):
    # 1. Cari user berdasarkan email
    user = db.query(User).filter(User.email == email).first()
    
    # 2. Verifikasi password (jika user tidak ada atau password salah, gagalkan)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Wrong Email or Password!")
        
    # 3. Generate JWT (Payload berisi ID User dan Waktu Expired)
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user.id),
        "exp": expire
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return token