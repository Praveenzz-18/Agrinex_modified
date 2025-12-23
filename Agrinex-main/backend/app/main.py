from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import httpx
from datetime import datetime
import uvicorn

# Import ALL services from both files
from app.services.crop_service import CropService
from app.services.irrigation_service import recommend_irrigation_with_weather
from app.core.appwrite import appwrite_service
from app.services.user_service import user_service
app = FastAPI(
    title="🌾 Complete Farm API (Merged)",
    description="Irrigation + Crop + Weather + Farms + Auth",
    version="2.0.0"
)

# CORS for ALL frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# WEATHER MODELS (from main.py)
# ========================================
class CurrentWeatherOut(BaseModel):
    location: str
    coordinates: Dict[str, float]
    temperature: float
    feelsLike: float
    condition: str
    humidity: int
    windSpeed: float
    windDirection: int
    pressure: float
    visibility: float
    uvIndex: float
    precipMm: float  # Current precipitation in mm
    rainChance: int  # Chance of rain today (%)
    sunrise: str
    sunset: str
    lastUpdated: str

class ForecastDay(BaseModel):
    date: str
    high: float
    low: float
    condition: str
    rainChance: int
    rainAmount: float
    humidity: int
    windSpeed: float
    isToday: bool

class ForecastOut(BaseModel):
    days: List[ForecastDay]

# ========================================
# CROP/IRRIGATION MODELS (from main1.py)
# ========================================
class CropRequest(BaseModel):
    soil_type: str
    soil_quality: str
    state_name: str
    district_name: str

class IrrigationRequest(BaseModel):
    soil_feel: str
    application_rate: float
    state_name: str
    district_name: str
    farm_id: str = None

# ========================================
# ROOT + HEALTH
# ========================================
@app.get("/")
def root():
    return {
        "message": "🌾 Complete Farm API - All endpoints ready!",
        "endpoints": [
            "/api/v1/crop/recommend",
            "/api/v1/irrigation/recommend", 
            "/api/v1/combined",
            "/api/v1/weather/current",
            "/api/v1/auth/profile"
        ]
    }

@app.get("/health")
def health():
    return {"status": "healthy", "appwrite": "connected"}

# ========================================
# CROP + IRRIGATION (from main1.py)
# ========================================
@app.post("/api/v1/crop/recommend")
def crop_recommend(req: CropRequest):
    result = CropService.recommend_crops(
        soil_type=req.soil_type,
        soil_quality=req.soil_quality,
        state_name=req.state_name,
        district_name=req.district_name,
    )
    # Log to Appwrite
    appwrite_service.log_crop_prediction("temp_user", "no_farm", result)
    return result

@app.post("/api/v1/irrigation/recommend")
def irrigation_recommend(req: IrrigationRequest):
    result = recommend_irrigation_with_weather(
        soil_feel=req.soil_feel,
        application_rate_mm_per_h=req.application_rate,
        state_name=req.state_name,
        district_name=req.district_name,
    )
    # Log to Appwrite
    appwrite_service.log_irrigation("temp_user", req.farm_id or "no_farm", result)
    return result

@app.post("/api/v1/combined")
def combined_recommend(crop_req: CropRequest, irri_req: IrrigationRequest):
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
    return {"crop_recommendation": crop_result, "irrigation_recommendation": irri_result}

# ========================================
# WEATHER ENDPOINTS (from main.py)
# ========================================
WEATHER_API_KEY = "985cb1efea8c4871ab5125147252312"
WEATHER_BASE = "https://api.weatherapi.com/v1"

@app.get("/api/v1/weather/geocode")
async def geocode(q: str):
    """Search for locations by name and return coordinates"""
    url = f"{WEATHER_BASE}/search.json?key={WEATHER_API_KEY}&q={q}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
    data = res.json()
    
    results = []
    for loc in data:
        results.append({
            "name": loc.get("name", ""),
            "region": loc.get("region", ""),
            "country": loc.get("country", ""),
            "lat": loc.get("lat", 0),
            "lon": loc.get("lon", 0)
        })
    
    return {"results": results}

@app.get("/api/v1/weather/current", response_model=CurrentWeatherOut)
async def get_current_weather(lat: float, lon: float):
    """Get current weather for given coordinates with sunrise/sunset"""
    # Fetch both current and forecast (for sunrise/sunset)
    current_url = f"{WEATHER_BASE}/current.json?key={WEATHER_API_KEY}&q={lat},{lon}"
    forecast_url = f"{WEATHER_BASE}/forecast.json?key={WEATHER_API_KEY}&q={lat},{lon}&days=1"
    
    async with httpx.AsyncClient() as client:
        current_res = await client.get(current_url)
        forecast_res = await client.get(forecast_url)
    
    if current_res.status_code != 200:
        raise HTTPException(status_code=current_res.status_code, detail="Weather API error")
    
    current_data = current_res.json()
    forecast_data = forecast_res.json()
    
    loc = current_data["location"]
    curr = current_data["current"]
    
    # Get sunrise/sunset from forecast
    astro = forecast_data["forecast"]["forecastday"][0]["astro"]
    day_data = forecast_data["forecast"]["forecastday"][0]["day"]
    
    return CurrentWeatherOut(
        location=f"{loc['name']}, {loc['region']}, {loc['country']}",
        coordinates={"lat": loc["lat"], "lon": loc["lon"]},
        temperature=curr["temp_c"],
        feelsLike=curr["feelslike_c"],
        condition=curr["condition"]["text"],
        humidity=curr["humidity"],
        windSpeed=curr["wind_kph"],
        windDirection=curr["wind_degree"],
        pressure=curr["pressure_mb"],
        visibility=curr["vis_km"],
        uvIndex=curr["uv"],
        precipMm=curr.get("precip_mm", 0),  # Current precipitation
        rainChance=day_data.get("daily_chance_of_rain", 0),  # Today's rain chance
        sunrise=astro["sunrise"],
        sunset=astro["sunset"],
        lastUpdated=curr["last_updated"]
    )

@app.get("/api/v1/weather/forecast", response_model=ForecastOut)
async def get_forecast(lat: float, lon: float, days: int = Query(7, ge=1, le=14)):
    """Get weather forecast for given coordinates"""
    url = f"{WEATHER_BASE}/forecast.json?key={WEATHER_API_KEY}&q={lat},{lon}&days={days}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
    
    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail="Weather API error")
    
    data = res.json()
    forecast_days = []
    
    for day in data["forecast"]["forecastday"]:
        forecast_days.append(ForecastDay(
            date=day["date"],
            high=day["day"]["maxtemp_c"],
            low=day["day"]["mintemp_c"],
            condition=day["day"]["condition"]["text"],
            rainChance=day["day"]["daily_chance_of_rain"],
            rainAmount=day["day"].get("totalprecip_mm", 0),
            humidity=day["day"]["avghumidity"],
            windSpeed=day["day"]["maxwind_kph"],
            isToday=(day["date"] == data["forecast"]["forecastday"][0]["date"])
        ))
    
    return ForecastOut(days=forecast_days)

# ========================================
# AUTH + USER (New)
# ========================================
class UserProfile(BaseModel):
    full_name: str
    email: str
    phone: str
    village: str
    district: str
    state: str

@app.post("/api/v1/auth/profile")
def save_profile(profile: UserProfile):
    user_service.create_user_profile("temp_user_123", profile.dict())
    return {"success": True, "message": "Profile saved!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
