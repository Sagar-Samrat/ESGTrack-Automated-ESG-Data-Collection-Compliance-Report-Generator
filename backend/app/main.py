from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
from app.config import settings
from app.utils.logger import logger
from app.routes import auth, companies, uploads, cleaning, metrics, reports, compliance, audit

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Automated ESG Data Collection, Validation, Analytics & Compliance Report Generator for Mid-Size Enterprises.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Timing & Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - Status: {response.status_code} ({duration:.3f}s)")
    return response

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please check backend logs for details."}
    )

# Root & Health Check
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "environment": settings.app_env,
        "version": "1.0.0",
        "timestamp": time.time()
    }

@app.get("/", tags=["System"])
def root():
    return {
        "message": f"Welcome to {settings.app_name} API Core.",
        "documentation": "/docs",
        "status": "operational"
    }

# Register Routers
app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(uploads.router)
app.include_router(cleaning.router)
app.include_router(metrics.router)
app.include_router(reports.router)
app.include_router(compliance.router)
app.include_router(audit.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)

