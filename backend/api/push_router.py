# from typing import Any, Dict

# from fastapi import APIRouter, Depends
# from pydantic import BaseModel
# from sqlalchemy.orm import Session

# from backend.api.auth_dependency import get_current_user
# from backend.database import get_db
# from backend.model.push_subscription import PushSubscription
# from backend.model.user import User

# router = APIRouter(
#     prefix="/push",
#     tags=["Push Notifications"],
# )


# class PushSubscriptionCreate(BaseModel):
#     subscription: Dict[str, Any]


# @router.post("/subscribe")
# def save_push_subscription(
#     payload: PushSubscriptionCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     existing = (
#         db.query(PushSubscription)
#         .filter(PushSubscription.user_id == current_user.id)
#         .first()
#     )

#     if existing:
#         existing.subscription_json = payload.subscription
#     else:
#         subscription = PushSubscription(
#             user_id=current_user.id,
#             subscription_json=payload.subscription,
#         )
#         db.add(subscription)

#     db.commit()

#     return {
#         "message": "Push subscription saved successfully",
#     }