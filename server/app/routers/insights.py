"""
AI Insights router — smart recommendations and demand forecasting.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.insights_engine import generate_insights, generate_forecast, generate_product_forecast

router = APIRouter()


@router.get("/")
async def get_insights(db: Session = Depends(get_db)):
    """Get all AI-generated insights (reorder alerts, spend anomalies, supplier risk)."""
    return generate_insights(db)


@router.get("/forecast")
async def get_forecast(db: Session = Depends(get_db)):
    """Get demand forecast based on historical PO data (Exponential Smoothing + seasonality)."""
    return generate_forecast(db)


@router.get("/forecast/products")
async def get_product_forecast(db: Session = Depends(get_db)):
    """Get per-product demand forecast for top 10 most ordered products."""
    return generate_product_forecast(db)
