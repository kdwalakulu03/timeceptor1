from pydantic import BaseModel, validator
from datetime import datetime
import hashlib
from typing import Literal
from timeceptor01.app.core.config import settings

class BirthData(BaseModel):
    dob: str  # Format: YYYY-MM-DD
    time: str  # Format: HH:MM
    location: str  # Preset city name
    gender: Literal["Male", "Female"]
    current_datetime: str  # Format: YYYY-MM-DD HH:MM:SS
    current_location: str | None = None  # Optional city name
    device_fingerprint: str  # Hashed device info

    @validator('dob')
    def validate_dob(cls, v):
        try:
            dob_date = datetime.strptime(v, "%Y-%m-%d")
            if not (1900 <= dob_date.year <= 2100):
                raise ValueError("Year must be between 1900 and 2100")
        except ValueError:
            raise ValueError("Invalid DOB format, use YYYY-MM-DD")
        return v

    @validator('time')
    def validate_time(cls, v):
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            raise ValueError("Invalid time format, use HH:MM")
        return v

    @validator('location')
    def validate_location(cls, v):
        # Preset major cities (expand as needed)
        valid_cities = ["Galle", "Colombo", "Mumbai", "Delhi", "Chennai", "Bangalore"]
        if v not in valid_cities:
            raise ValueError(f"Location must be one of {valid_cities}")
        return v

    @validator('current_datetime')
    def validate_current_datetime(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            raise ValueError("Invalid current datetime format, use YYYY-MM-DD HH:MM:SS")
        return v

    @validator('current_location', always=True)
    def validate_current_location(cls, v):
        if v is not None:
            valid_cities = ["Galle", "Colombo", "Mumbai", "Delhi", "Chennai", "Bangalore"]
            if v not in valid_cities:
                raise ValueError(f"Current location must be one of {valid_cities} or null")
        return v

    @validator('device_fingerprint')
    def validate_device_fingerprint(cls, v):
        if not v or len(v) != 64:  # SHA-256 hash length
            raise ValueError("Invalid device fingerprint")
        return v

    def encrypt(self):
        """Simple SHA-256 hash of input data for obfuscation."""
        data_str = f"{self.dob}{self.time}{self.location}{self.gender}{self.current_datetime}{self.current_location or ''}"
        return hashlib.sha256(data_str.encode()).hexdigest()

class BirthDataInput(BaseModel):
    dob: str
    time: str
    location: str
    gender: Literal["Male", "Female"]
    current_location: str | None = None
    user_agent: str  # For device fingerprinting

    def to_birth_data(self, current_datetime: str):
        """Convert input to BirthData with fingerprint and current datetime."""
        fingerprint = hashlib.sha256(self.user_agent.encode()).hexdigest()
        return BirthData(
            dob=self.dob,
            time=self.time,
            location=self.location,
            gender=self.gender,
            current_datetime=current_datetime,
            current_location=self.current_location,
            device_fingerprint=fingerprint
        )