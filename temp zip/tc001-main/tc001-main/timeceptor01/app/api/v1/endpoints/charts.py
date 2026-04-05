from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from timeceptor01.app.core.astrology_service import AstrologyService
from timeceptor01.app.core.rule_engine import RuleEngine
from timeceptor01.app.schemas.chart import BirthDataInput
from timeceptor01.app.db.session import SessionLocal
from timeceptor01.app.db.models import Chart, User, Prediction
from fastapi_jwt_auth import AuthJWT
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime, timedelta
import pytz
import uuid

router = APIRouter()
astro_service = AstrologyService()
rule_engine = RuleEngine()
limiter = Limiter(key_func=get_remote_address)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("", status_code=201)
@limiter.limit("10/minute")
async def create_chart(
    birth_data_input: BirthDataInput,
    request: Request,
    db: Session = Depends(get_db),
    Authorize: AuthJWT = Depends()
):
    Authorize.jwt_required()
    user_email = Authorize.get_jwt_subject()
    db_user = db.query(User).filter_by(email=user_email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has already submitted a chart
    existing_chart = db.query(Chart).filter_by(user_id=db_user.id).first()
    if existing_chart:
        raise HTTPException(status_code=403, detail="User already submitted a chart. Subscribe to add more profiles.")
    
    # Convert input to BirthData
    current_datetime = datetime.now(pytz.UTC).strftime("%Y-%m-%d %H:%M:%S")
    birth_data = birth_data_input.to_birth_data(current_datetime)
    
    # Validate age
    dob_date = datetime.strptime(birth_data.dob, "%Y-%m-%d")
    age = (datetime.now(pytz.UTC).date() - dob_date.date()).days // 365
    if age < 0 or age > 120:
        raise HTTPException(status_code=400, detail="Invalid age based on DOB")
    
    # Encrypt input
    encrypted_data = birth_data.encrypt()
    
    # Calculate chart and predictions
    chart_result = astro_service.calculate_chart(birth_data.dict(exclude={"device_fingerprint", "current_datetime", "current_location", "gender"}))
    predictions = rule_engine.generate_predictions(chart_result)
    
    # Save chart
    profile_id = uuid.uuid4()
    db_chart = Chart(
        id=uuid.uuid4(),
        user_id=db_user.id,
        profile_id=profile_id,
        birth_data=birth_data.dict(),
        chart_data=chart_result,
        is_additional=False,
        created_at=datetime.now(pytz.UTC)
    )
    db_user.profile_count = 1
    db.add(db_chart)
    
    # Save basic predictions
    for pred in predictions:
        db_pred = Prediction(
            id=uuid.uuid4(),
            chart_id=db_chart.id,
            user_id=db_user.id,
            profile_id=profile_id,
            prediction_code=pred["prediction_code"],
            prediction_type="basic",
            text=pred["text"],
            confidence=pred["confidence"],
            created_at=datetime.now(pytz.UTC)
        )
        db.add(db_pred)
        for sub_pred in pred.get("sub", []):
            db_sub_pred = Prediction(
                id=uuid.uuid4(),
                chart_id=db_chart.id,
                user_id=db_user.id,
                profile_id=profile_id,
                parent_prediction_id=db_pred.id,
                prediction_code=sub_pred["prediction_code"],
                prediction_type="basic",
                text=sub_pred["text"],
                confidence=sub_pred["confidence"],
                created_at=datetime.now(pytz.UTC)
            )
            db.add(db_sub_pred)
    
    db.commit()
    db.refresh(db_chart)
    db.refresh(db_user)
    
    return {"chart": chart_result, "predictions": predictions}

@router.post("/additional", status_code=201)
@limiter.limit("5/day")
async def create_additional_chart(
    birth_data_input: BirthDataInput,
    request: Request,
    db: Session = Depends(get_db),
    Authorize: AuthJWT = Depends()
):
    Authorize.jwt_required()
    user_email = Authorize.get_jwt_subject()
    db_user = db.query(User).filter_by(email=user_email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check subscription and profile limit
    if not db_user.is_paid or db_user.subscription_end_date < datetime.now(pytz.UTC):
        raise HTTPException(status_code=403, detail="Active premium subscription required")
    if db_user.profile_count >= 3:
        raise HTTPException(status_code=403, detail="Max 3 profiles reached. Contact support.")
    
    # Convert input to BirthData
    current_datetime = datetime.now(pytz.UTC).strftime("%Y-%m-%d %H:%M:%S")
    birth_data = birth_data_input.to_birth_data(current_datetime)
    
    # Validate age (child <18, partner >16)
    dob_date = datetime.strptime(birth_data.dob, "%Y-%m-%d")
    age = (datetime.now(pytz.UTC).date() - dob_date.date()).days // 365
    if age < 0 or age > 120:
        raise HTTPException(status_code=400, detail="Invalid age based on DOB")
    if age >= 18 and age <= 16:
        raise HTTPException(status_code=400, detail="Family profiles must be for children (<18) or partners (>16)")
    
    # Encrypt input
    encrypted_data = birth_data.encrypt()
    
    # Calculate chart and predictions
    chart_result = astro_service.calculate_chart(birth_data.dict(exclude={"device_fingerprint", "current_datetime", "current_location", "gender"}))
    predictions = rule_engine.generate_predictions(chart_result)
    
    # Save chart
    profile_id = uuid.uuid4()
    db_chart = Chart(
        id=uuid.uuid4(),
        user_id=db_user.id,
        profile_id=profile_id,
        birth_data=birth_data.dict(),
        chart_data=chart_result,
        is_additional=True,
        created_at=datetime.now(pytz.UTC)
    )
    db_user.profile_count += 1
    db.add(db_chart)
    
    # Save basic predictions
    for pred in predictions:
        db_pred = Prediction(
            id=uuid.uuid4(),
            chart_id=db_chart.id,
            user_id=db_user.id,
            profile_id=profile_id,
            prediction_code=pred["prediction_code"],
            prediction_type="basic",
            text=pred["text"],
            confidence=pred["confidence"],
            created_at=datetime.now(pytz.UTC)
        )
        db.add(db_pred)
        for sub_pred in pred.get("sub", []):
            db_sub_pred = Prediction(
                id=uuid.uuid4(),
                chart_id=db_chart.id,
                user_id=db_user.id,
                profile_id=profile_id,
                parent_prediction_id=db_pred.id,
                prediction_code=sub_pred["prediction_code"],
                prediction_type="basic",
                text=sub_pred["text"],
                confidence=sub_pred["confidence"],
                created_at=datetime.now(pytz.UTC)
            )
            db.add(db_sub_pred)
    
    db.commit()
    db.refresh(db_chart)
    db.refresh(db_user)
    
    return {"chart": chart_result, "predictions": predictions}