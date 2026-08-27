from sqlalchemy import Column, Integer, String, Float, Text
from database import Base

class Trip(Base):
    __tablename__ = "trips"
    
    id                   = Column(Integer, primary_key=True, index=True)
    destination          = Column(String,  nullable=False)
    days                 = Column(Integer, nullable=False)
    budget               = Column(Float,   nullable=False)
    hotel_cost           = Column(Float,   nullable=True) 
    transportation_cost  = Column(Float,   nullable=True)
    food_cost            = Column(Float,   nullable=True)
    travel_month         = Column(String,  nullable=True)
    travel_style         = Column(String, nullable=True)
    category             = Column(String,  nullable=False)
    daily_budget         = Column(Float,   nullable=False)
    vehicle              = Column(String,  nullable=True)
    season               = Column(String,  nullable=True)
    total_estimated_cost = Column(Float,   nullable=True)
    rest_budget          = Column(Float,   nullable=True)
    ai_recommendation    = Column(Text,    nullable = True)