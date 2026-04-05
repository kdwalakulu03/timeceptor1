from pydantic import BaseModel
from typing import List, Optional

class PredictionBase(BaseModel):
    major: str
    confidence: float
    sub_nodes: List[str]

class PredictionCreate(PredictionBase):
    pass

class Prediction(PredictionBase):
    id: int

    class Config:
        orm_mode = True