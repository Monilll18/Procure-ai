"""
Role Guard Middleware — enforces RBAC on backend endpoints.

Usage in routers:
    from app.middleware.role_guard import require_role

    @router.post("/{po_id}/approve")
    async def approve_po(
        po_id: UUID,
        db: Session = Depends(get_db),
        user: dict = Depends(require_role("manager", "admin", "approver")),
    ):
        # user dict contains: id, clerk_id, role, email, approval_limit

Returns 403 with a clear message if the user's role is not in the allowed list.
"""
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User


ROLE_LABELS = {
    "admin": "Admin",
    "manager": "Manager",
    "procurement_officer": "Procurement Officer",
    "approver": "Finance / Approver",
    "viewer": "Viewer",
}


def require_role(*allowed_roles: str):
    """
    FastAPI dependency factory.
    Returns a dependency that checks the authenticated user's role.

    Example:
        Depends(require_role("admin", "manager"))
    """

    async def _guard(
        clerk_id: str = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> dict:
        user = db.query(User).filter(User.clerk_id == clerk_id).first()

        if not user:
            raise HTTPException(
                status_code=403,
                detail="User profile not found. Please sign out and sign back in.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=403,
                detail="Your account has been deactivated. Contact an administrator.",
            )

        if user.role not in allowed_roles:
            allowed_labels = ", ".join(
                ROLE_LABELS.get(r, r) for r in allowed_roles
            )
            user_label = ROLE_LABELS.get(user.role, user.role)
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Access denied. This action requires {allowed_labels} "
                    f"level rights. Your current role is {user_label}."
                ),
            )

        return {
            "id": str(user.id),
            "clerk_id": user.clerk_id,
            "role": user.role,
            "email": user.email,
            "department": user.department,
            "approval_limit": user.approval_limit,
        }

    return _guard
