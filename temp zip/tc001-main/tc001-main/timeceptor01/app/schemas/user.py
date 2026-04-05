from pydantic import BaseModel, validator

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
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

class UserLogin(UserBase):
    password: str