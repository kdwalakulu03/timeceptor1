from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, validator
from passlib.context import CryptContext
from fastapi_jwt_auth import AuthJWT
from datetime import timedelta, datetime
from sqlalchemy.orm import Session
from timeceptor01.app.db.session import SessionLocal
from timeceptor01.app.db.models import User, Chart
import uuid
import pytz

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserCreate(BaseModel):
    email: str
    password: str

    @validator('email')
    def validate_email(cls, v):
        verified_domains = [
            "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com",
            "icloud.com", "protonmail.com", "example.com"  # For testing
        ]
        domain = v.split('@')[-1].lower()
        if domain not in verified_domains:
            raise ValueError("Only verified email domains (e.g., Gmail, Yahoo, Outlook) are allowed")
        return v

class UserLogin(BaseModel):
    email: str
    password: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter_by(email=user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = pwd_context.hash(user.password)
    new_user = User(
        id=uuid.uuid4(),
        email=user.email,
        hashed_password=hashed_password,
        is_paid=False,
        profile_count=0,
        subscription_start_date=datetime.now(pytz.UTC),
        subscription_type=None,
        subscription_price=0.0
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"msg": "User registered successfully"}

@router.post("/login")
async def login(user: UserLogin, db: Session = Depends(get_db), Authorize: AuthJWT = Depends()):
    db_user = db.query(User).filter_by(email=user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = Authorize.create_access_token(
        subject=db_user.email,
        user_claims={"is_paid": db_user.is_paid, "profile_count": db_user.profile_count},
        expires_time=timedelta(minutes=30)
    )
    refresh_token = Authorize.create_refresh_token(
        subject=db_user.email,
        user_claims={"is_paid": db_user.is_paid, "profile_count": db_user.profile_count},
        expires_time=timedelta(days=7)
    )
    return {"access_token": access_token, "refresh_token": refresh_token}

@router.post("/refresh")
async def refresh(Authorize: AuthJWT = Depends()):
    Authorize.jwt_refresh_token_required()
    current_user = Authorize.get_jwt_subject()
    new_access_token = Authorize.create_access_token(
        subject=current_user,
        user_claims=Authorize.get_raw_jwt(),
        expires_time=timedelta(minutes=30)
    )
    return {"access_token": new_access_token}

@router.get("/submission-status")
async def get_submission_status(db: Session = Depends(get_db), Authorize: AuthJWT = Depends()):
    Authorize.jwt_required()
    user_email = Authorize.get_jwt_subject()
    db_user = db.query(User).filter_by(email=user_email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    trial_active = (datetime.now(pytz.UTC) - db_user.subscription_start_date).days <= 7 and not db_user.is_paid
    has_submitted = db.query(Chart).filter_by(user_id=db_user.id).first() is not None
    return {
        "has_submitted": has_submitted,
        "is_paid": db_user.is_paid,
        "profile_count": db_user.profile_count,
        "trial_active": trial_active,
        "subscription_end_date": db_user.subscription_end_date.isoformat() if db_user.subscription_end_date else None
    }

@router.post("/subscribe")
async def subscribe(
    subscription: dict,
    db: Session = Depends(get_db),
    Authorize: AuthJWT = Depends()
):
    Authorize.jwt_required()
    user_email = Authorize.get_jwt_subject()
    db_user = db.query(User).filter_by(email=user_email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.is_paid:
        raise HTTPException(status_code=400, detail="User already subscribed")
    subscription_type = subscription.get("subscription_type")
    if subscription_type not in ["monthly", "yearly"]:
        raise HTTPException(status_code=400, detail="Invalid subscription type")
    
    now = datetime.now(pytz.UTC)
    db_user.is_paid = True
    db_user.subscription_type = subscription_type
    db_user.subscription_start_date = now
    if subscription_type == "monthly":
        db_user.subscription_price = 4.99
        db_user.subscription_end_date = now + timedelta(days=30)
    else:  # yearly
        db_user.subscription_price = 49.99
        db_user.subscription_end_date = now + timedelta(days=365)
    
    db.commit()
    db.refresh(db_user)
    return {"msg": f"Subscribed to {subscription_type} plan"}

@router.post("/cancel")
async def cancel_subscription(db: Session = Depends(get_db), Authorize: AuthJWT = Depends()):
    Authorize.jwt_required()
    user_email = Authorize.get_jwt_subject()
    db_user = db.query(User).filter_by(email=user_email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if not db_user.is_paid:
        raise HTTPException(status_code=400, detail="No active subscription")
    
    now = datetime.now(pytz.UTC)
    if db_user.subscription_type == "monthly":
        db_user.subscription_end_date = now.replace(day=now.day) + timedelta(days=30)
    else:  # yearly
        db_user.subscription_end_date = now.replace(year=now.year + 1, month=now.month, day=now.day)
    db_user.is_paid = False
    db.commit()
    db.refresh(db_user)
    return {"msg": "Subscription canceled, benefits active until " + db_user.subscription_end_date.isoformat()}