# validations.py

from pydantic import BaseModel, Field
from typing import Any, Dict

class PredictionRequest(BaseModel):
    user_id: int = Field(..., description="The ID of the user making the request")
    chart_data: Dict[str, Any] = Field(..., description="Astrological chart data for predictions")

def validate_prediction_request(request: PredictionRequest) -> None:
    """Validates the incoming prediction request."""
    request.validate()  # This will raise an error if validation fails

# Additional validation functions can be added here as needed.