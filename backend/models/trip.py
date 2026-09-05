from sqlalchemy import Column, Integer, BigInteger, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Trip(Base):
    __tablename__ = "trips"
    
    id                   = Column(Integer, primary_key=True, index=True)
    user_id              = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    destination          = Column(String,  nullable=False)
    origin               = Column(String,  nullable=False)
    days                 = Column(Integer, nullable=False)
    budget               = Column(Float,   nullable=False)
    hotel_cost           = Column(Float,   nullable=True) 
    transportation_cost  = Column(Float,   nullable=True)
    food_cost            = Column(Float,   nullable=True)
    travel_month         = Column(String,  nullable=True)
    travel_year          = Column(Integer, nullable=True)
    travel_style         = Column(String, nullable=True)
    category             = Column(String,  nullable=False)
    daily_budget         = Column(Float,   nullable=False)
    vehicle              = Column(String,  nullable=True)
    season               = Column(String,  nullable=True)
    total_estimated_cost = Column(Float,   nullable=True)
    rest_budget          = Column(Float,   nullable=True)
    ai_recommendation    = Column(Text,    nullable = True)
    created_at           = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="trips")