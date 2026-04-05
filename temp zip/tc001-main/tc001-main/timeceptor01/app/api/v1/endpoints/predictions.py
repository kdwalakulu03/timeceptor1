from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from timeceptor01.app.db.session import SessionLocal
from timeceptor01.app.db.models import Chart, User, Prediction
from timeceptor01.app.core.weekly_prediction_service import WeeklyPredictionService
from fastapi_jwt_auth import AuthJWT
from datetime import datetime
import pytz
import uuid

router = APIRouter()
weekly_service = WeeklyPredictionService()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{chart_id}")
async def get_predictions(
    chart_id: str,
    db: Session = Depends(get_db),
    Authorize: AuthJWT = Depends()
):
    Authorize.jwt_required()
    user_email = Authorize.get_jwt_subject()
    db_user = db.query(User).filter_by(email=user_email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_chart = db.query(Chart).filter_by(id=chart_id, user_id=db_user.id).first()
    if not db_chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    # Get basic predictions from chart
    predictions = db.query(Prediction).filter_by(chart_id=chart_id).all()
    result_predictions = [
        {
            "code": p.prediction_code,
            "text": p.text,
            "confidence": p.confidence,
            "type": p.prediction_type,
            "week_start": p.week_start.isoformat() if p.week_start else None
        }
        for p in predictions
    ]
    
    # Add weekly/crypto predictions for premium/trial users
    trial_active = (datetime.now(pytz.UTC) - db_user.subscription_start_date).days <= 7 and not db_user.is_paid
    if db_user.is_paid or trial_active:
        week_start = datetime.now(pytz.UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        weekly_predictions = weekly_service.generate_weekly_predictions(db_chart.chart_data, week_start)
        for pred in weekly_predictions:
            # Check if prediction already exists
            existing_pred = db.query(Prediction).filter_by(prediction_code=pred["prediction_code"]).first()
            if not existing_pred:
                db_pred = Prediction(
                    id=uuid.uuid4(),
                    chart_id=chart_id,
                    user_id=db_user.id,
                    profile_id=db_chart.profile_id,
                    prediction_code=pred["prediction_code"],
                    prediction_type=pred["prediction_type"],
                    text=pred["text"],
                    confidence=pred["confidence"],
                    week_start=datetime.strptime(pred["week_start"], "%Y-%m-%d").date(),
                    created_at=datetime.now(pytz.UTC)
                )
                db.add(db_pred)
                result_predictions.append({
                    "code": pred["prediction_code"],
                    "text": pred["text"],
                    "confidence": pred["confidence"],
                    "type": pred["prediction_type"],
                    "week_start": pred["week_start"]
                })
        db.commit()
    
    return {"predictions": result_predictions}