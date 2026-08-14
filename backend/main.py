from fastapi import FastAPI
from pydantic import BaseModel
from services.trip_service import (
    calculate_budget,
    get_trip_category,
    get_travel_season
)


class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    hotel_cost: float
    transportation_cost: float
    food_cost: float
    travel_month: str 

app = FastAPI()

# GET endpoint
@app.get("/")
def home():
    return {
        "message": "Welcome to KelanaAI"
    }

@app.get("/health")
def health():
    return {
        "status": "OK"
    }

# POST
@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    budget_perday, total_estimated_cost, rest_budget = calculate_budget(
        request.days,
        request.budget,
        request.hotel_cost,
        request.transportation_cost,
        request.food_cost
    )

    category, transport = get_trip_category(
        request.budget
    )

    season = get_travel_season(
        request.travel_month
    )

    return {
        "destination": request.destination,
        "days": request.days,
        "budget": request.budget,
        "budget_perday": budget_perday,
        "total_estimated_cost": total_estimated_cost,
        "rest_budget": rest_budget,
        "category": category,
        "recommended_transport": transport,
        "travel_season": season
    }