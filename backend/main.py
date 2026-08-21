from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from services.trip_service import (
    calculate_budget,
    get_trip_category,
    recomendation_destination,
    get_travel_season
)
from models.trip import Trip
from database import SessionLocal, init_db

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    hotel_cost: float
    transportation_cost: float
    food_cost: float
    travel_month: str 

class TripUpdateBudget(BaseModel):
    budget: float
    hotel_cost: float
    transportation_cost: float
    food_cost: float

app = FastAPI()
init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# GET
@app.get("/")
def home():
    return {"message": "Welcome to KelanaAI"}

@app.get("/health")
def health():
    return {"status": "OK"}

# GET
@app.get("/api/v1/recommendations/{country}")
def get_destinations(country: str):
    places = recomendation_destination(country)
    return {
        "country": country,
        "recommended_places": places
    }

# POST
@app.post("/api/v1/trips")
def create_trip(request: TripRequest, db: Session = Depends(get_db)):
    budget_perday, total_estimated_cost, rest_budget = calculate_budget(
        days=request.days, 
        budget=request.budget, 
        hotel_cost=request.hotel_cost, 
        transportation_cost=request.transportation_cost, 
        food_cost=request.food_cost
    )
    category, vehicle = get_trip_category(request.budget)
    season = get_travel_season(request.travel_month)

    trip = Trip(
        destination=request.destination,
        days=request.days,
        budget=request.budget,
        category=category,
        daily_budget=budget_perday,
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)
    
    response = {
        "trip_data": trip,
        "trip_details": {
            "vehicle": vehicle,
            "season": season,
            "total_estimated_cost_per_day": total_estimated_cost,
            "rest_budget": rest_budget
        }
    }
    return response

# PUT 
@app.put("/api/v1/trips/{trip_id}")
def update_trip_budget(trip_id: int, request: TripUpdateBudget, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip.budget = request.budget
    
    budget_perday, _, _ = calculate_budget(
        days=trip.days, 
        budget=request.budget, 
        hotel_cost=request.hotel_cost, 
        transportation_cost=request.transportation_cost, 
        food_cost=request.food_cost
    )
    
    category, vehicle = get_trip_category(request.budget)
    trip.daily_budget = budget_perday
    trip.category = category
    db.commit()
    db.refresh(trip)
    return trip

# DELETE
@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    db.delete(trip)
    db.commit()
    return {"message": f"Trip dengan ID {trip_id} berhasil dihapus"}