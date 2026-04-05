from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from timeceptor01.app.db.session import SessionLocal
from timeceptor01.app.db.models import Chart, User, Prediction
from timeceptor01.app.core.rule_engine import RuleEngine
from fastapi_jwt_auth import AuthJWT
from datetime import datetime
import pytz
import uuid

router = APIRouter()
rule_engine = RuleEngine()

class RegenerateRequest(BaseModel):
    secret_key: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/regenerate-predictions/{chart_id}")
async def regenerate_predictions(
    chart_id: str,
    request: RegenerateRequest,
    db: Session = Depends(get_db),
    Authorize: AuthJWT = Depends()
):
    # Verify secret key (stored in .env)
    from timeceptor01.app.core.config import settings
    if request.secret_key != settings.authjwt_secret_key:
        raise HTTPException(status_code=403, detail="Invalid secret key")
    
    Authorize.jwt_required()
    user_email = Authorize.get_jwt_subject()
    db_user = db.query(User).filter_by(email=user_email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_chart = db.query(Chart).filter_by(id=chart_id, user_id=db_user.id).first()
    if not db_chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    # Delete existing basic predictions for this chart
    db.query(Prediction).filter_by(chart_id=chart_id, prediction_type="basic").delete()
    
    # Generate and save new basic predictions
    predictions = rule_engine.generate_predictions(db_chart.chart_data)
    for pred in predictions:
        db_pred = Prediction(
            id=uuid.uuid4(),
            chart_id=db_chart.id,
            user_id=db_user.id,
            profile_id=db_chart.profile_id,
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
                profile_id=db_chart.profile_id,
                parent_prediction_id=db_pred.id,
                prediction_code=sub_pred["prediction_code"],
                prediction_type="basic",
                text=sub_pred["text"],
                confidence=sub_pred["confidence"],
                created_at=datetime.now(pytz.UTC)
            )
            db.add(db_sub_pred)
    
    db.commit()
    return {"msg": f"Predictions regenerated for chart {chart_id}"}