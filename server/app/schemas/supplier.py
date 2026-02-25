from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional
from enum import Enum


class SupplierStatusEnum(str, Enum):
    active = "active"
    inactive = "inactive"
    blacklisted = "blacklisted"


class SupplierCreate(BaseModel):
    name: str = Field(..., max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    rating: float = Field(default=4.0, ge=0.0, le=5.0)
    status: SupplierStatusEnum = SupplierStatusEnum.active
    contact_person: Optional[str] = Field(None, max_length=255)
    website: Optional[str] = Field(None, max_length=500)
    payment_terms: Optional[str] = Field(None, max_length=100)
    lead_time_days: Optional[int] = None
    tax_id: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    categories: Optional[str] = None
    # Portal invite
    send_portal_invite: bool = False


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    status: Optional[SupplierStatusEnum] = None
    contact_person: Optional[str] = None
    website: Optional[str] = None
    payment_terms: Optional[str] = None
    lead_time_days: Optional[int] = None
    tax_id: Optional[str] = None
    notes: Optional[str] = None
    categories: Optional[str] = None


class SupplierResponse(BaseModel):
    id: UUID
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    rating: float
    status: SupplierStatusEnum
    contact_person: Optional[str] = None
    website: Optional[str] = None
    payment_terms: Optional[str] = None
    lead_time_days: Optional[int] = None
    tax_id: Optional[str] = None
    notes: Optional[str] = None
    categories: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

