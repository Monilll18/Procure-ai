"""
Supplier JWT Authentication Middleware.
Parallel to Clerk auth — used exclusively for supplier portal endpoints.
"""
import os
import bcrypt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.database import get_db

# JWT settings
SUPPLIER_JWT_SECRET = os.getenv("SUPPLIER_JWT_SECRET", os.getenv("CLERK_SECRET_KEY", "supplier-portal-secret-key"))
SUPPLIER_JWT_ALGORITHM = "HS256"
SUPPLIER_JWT_EXPIRE_HOURS = 24 * 7  # 7 days

supplier_security = HTTPBearer()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_supplier_token(user_id: str, supplier_id: str, email: str, role: str) -> str:
    """Create a JWT token for a supplier user."""
    expire = datetime.utcnow() + timedelta(hours=SUPPLIER_JWT_EXPIRE_HOURS)
    payload = {
        "sub": user_id,
        "supplier_id": supplier_id,
        "email": email,
        "role": role,
        "type": "supplier",
        "exp": expire,
    }
    return jwt.encode(payload, SUPPLIER_JWT_SECRET, algorithm=SUPPLIER_JWT_ALGORITHM)


async def get_current_supplier_user(
    credentials: HTTPAuthorizationCredentials = Depends(supplier_security),
    db: Session = Depends(get_db),
) -> dict:
    """
    FastAPI dependency: verifies supplier JWT token.
    Returns dict with user info: id, supplier_id, email, role.
    """
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SUPPLIER_JWT_SECRET, algorithms=[SUPPLIER_JWT_ALGORITHM])

        if payload.get("type") != "supplier":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user_id = payload.get("sub")
        supplier_id = payload.get("supplier_id")

        if not user_id or not supplier_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        # Verify user still exists and is active
        from app.models.supplier_user import SupplierUser
        user = db.query(SupplierUser).filter(
            SupplierUser.id == user_id,
            SupplierUser.is_active == True,
        ).first()

        if not user:
            raise HTTPException(status_code=401, detail="User account is deactivated")

        return {
            "id": str(user.id),
            "supplier_id": str(user.supplier_id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "must_change_password": user.must_change_password,
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
