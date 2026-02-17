"""
CompanyConfig model — stores company-level configuration.
One row per company (for now, single-tenant).
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, Enum as SQLEnum, DateTime
from sqlalchemy.sql import func
import enum
from app.database import Base


class CompanySize(str, enum.Enum):
    small = "1-10"
    medium = "11-50"
    large = "51-200"
    enterprise = "200+"


class CompanyConfig(Base):
    __tablename__ = "company_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_name = Column(String(200), nullable=False, default="My Company")
    industry = Column(String(100), nullable=False, default="general")
    company_size = Column(String(20), nullable=False, default="11-50")
    base_currency = Column(String(10), nullable=False, default="USD")
    fiscal_year_start = Column(Integer, nullable=False, default=1)  # Month 1-12
    tax_id = Column(String(100), nullable=True)
    address = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=True)

    # Onboarding state
    setup_completed = Column(Boolean, nullable=False, default=False)
    setup_step = Column(Integer, nullable=False, default=1)  # Track which step they're on

    # Feature toggles (industry-specific)
    expiry_tracking = Column(Boolean, nullable=False, default=False)
    batch_tracking = Column(Boolean, nullable=False, default=False)
    serial_tracking = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
