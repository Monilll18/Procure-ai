"""
Category model — hierarchical product categories with parent/child tree.
Supports industry templates (auto-loaded on company setup).
"""
from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    icon = Column(String(50), nullable=True)  # Lucide icon name
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)

    # Tree structure
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    parent = relationship("Category", remote_side=[id], backref="children")

    # Industry template tracking
    industry_template = Column(String(100), nullable=True)  # e.g. "manufacturing", "restaurant"

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
