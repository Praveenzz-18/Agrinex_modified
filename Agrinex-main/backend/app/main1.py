from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .services.crop_service import CropService
from .services.irrigation_service import recommend_irrigation_with_weather

app = FastAPI(
    title="🌾 Smart Irrigation & Crop API",
    description="ML-powered irrigation and crop recommendation with zero meters needed",
    version="1.0.0",
)

# Enable CORS for Streamlit + frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== Request Models ==========

class CropRequest(BaseModel):
    soil_type: str        # "Sandy", "Loam", "Clay"
    soil_quality: str     # "Poor", "Medium", "Rich"
    state_name: str       # "Chhattisgarh"
    district_name: str    # "Durg"


class IrrigationRequest(BaseModel):
    soil_feel: str        # "Dry and Crumbly", "Slightly Damp", "Wet and Muddy"
    application_rate: float  # mm/hour
    state_name: str
    district_name: str


# ========== Health Check ==========

@app.get("/")
def health():
    """Check API health"""
    return {
        "status": "ok",
        "service": "Smart Irrigation API",
        "version": "1.0.0",
    }


# ========== Crop Routes ==========

@app.post("/api/v1/crop/recommend")
def crop_recommend(req: CropRequest):
    """
    Recommend suitable crops based on soil type, fertility, and location weather.
    
    Example:
    {
        "soil_type": "Loam",
        "soil_quality": "Medium",
        "state_name": "Chhattisgarh",
        "district_name": "Durg"
    }
    """
    return CropService.recommend_crops(
        soil_type=req.soil_type,
        soil_quality=req.soil_quality,
        state_name=req.state_name,
        district_name=req.district_name,
    )


# ========== Irrigation Routes ==========

@app.post("/api/v1/irrigation/recommend")
def irrigation_recommend(req: IrrigationRequest):
    """
    Recommend irrigation schedule: whether to irrigate and how much water.
    Uses soil feel + forecast rain to decide.
    
    Example:
    {
        "soil_feel": "Slightly Damp",
        "application_rate": 5.0,
        "state_name": "Chhattisgarh",
        "district_name": "Durg"
    }
    """
    return recommend_irrigation_with_weather(
        soil_feel=req.soil_feel,
        application_rate_mm_per_h=req.application_rate,
        state_name=req.state_name,
        district_name=req.district_name,
    )


# ========== Combined Routes ==========

@app.post("/api/v1/combined")
def combined_recommend(crop_req: CropRequest, irri_req: IrrigationRequest):
    """
    Get both crop AND irrigation recommendation in one call.
    """
    crop_result = CropService.recommend_crops(
        soil_type=crop_req.soil_type,
        soil_quality=crop_req.soil_quality,
        state_name=crop_req.state_name,
        district_name=crop_req.district_name,
    )

    irri_result = recommend_irrigation_with_weather(
        soil_feel=irri_req.soil_feel,
        application_rate_mm_per_h=irri_req.application_rate,
        state_name=irri_req.state_name,
        district_name=irri_req.district_name,
    )

    return {
        "crop_recommendation": crop_result,
        "irrigation_recommendation": irri_result,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
