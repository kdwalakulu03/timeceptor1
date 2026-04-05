from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from timeceptor01.app.api.v1.endpoints import charts, users, predictions, admin
from fastapi_jwt_auth import AuthJWT
from fastapi_jwt_auth.exceptions import AuthJWTException
from timeceptor01.app.core.config import settings
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Timeceptor01 Engine")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@AuthJWT.load_config
def get_config():
    return settings

@app.exception_handler(AuthJWTException)
def authjwt_exception_handler(request: Request, exc: AuthJWTException):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": exc.message}
    )

app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(charts.router, prefix="/api/v1/charts", tags=["charts"])
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["predictions"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

@app.get("/")
async def root():
    return {"status": "Timeceptor01 API running"}