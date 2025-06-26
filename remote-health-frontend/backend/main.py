from fastapi import FastAPI
from app.routers import auth, patients, doctors, nurses, alerts, notes, locations
from app.core.config import settings

app = FastAPI(
    title="Remote Health Monitoring API",
    description="API for the Remote Health Monitoring System.",
    version="0.1.0"
)

# Add routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(patients.router, prefix="/api/v1/patients", tags=["Patients"])
app.include_router(doctors.router, prefix="/api/v1/doctors", tags=["Doctors"])
app.include_router(nurses.router, prefix="/api/v1/nurses", tags=["Nurses"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Alerts"])
app.include_router(notes.router, prefix="/api/v1/notes", tags=["Notes"])
app.include_router(locations.router, prefix="/api/v1/locations", tags=["Locations"])

@app.get("/")
async def root():
    return {"message": "Welcome to Remote Health Monitoring API"} 