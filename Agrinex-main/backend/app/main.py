from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import httpx
from datetime import datetime
import uvicorn

# Import ALL services from both files
from app.services.crop_service import CropService
from app.services.irrigation_service import recommend_irrigation_with_weather
from app.core.appwrite import appwrite_service
from app.services.user_service import user_service
from app.services.training_service import TrainingService

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
# WEATHER MODELS
# ========================================
class CurrentWeatherOut(BaseModel):
    location: str
    coordinates: Dict[str, float]
    temperature: float
    feelsLike: float
    condition: str
    humidity: int
    windSpeed: float
    windDirection: str
    pressure: float
    visibility: float
    uvIndex: float
    aqi: Optional[int] = None
    precipMm: float
    rainChance: int
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

class WeatherAnalyticsOut(BaseModel):
    avgTemp: float
    maxTemp: float
    minTemp: float
    totalRainfall: float
    avgHumidity: int
    avgWindSpeed: float
    extremeDays: int

class GeminiInsightsOut(BaseModel):
    summary: Dict[str, str]
    recommendations: List[Dict[str, str]]

class GeminiRequest(BaseModel):
    lat: float
    lon: float
    days: int = 7

# ========================================
# CROP/IRRIGATION MODELS
# ========================================
class CropRequest(BaseModel):
    soil_type: str
    soil_quality: str
    state_name: str
    district_name: str
    n_value: Optional[float] = None
    p_value: Optional[float] = None
    k_value: Optional[float] = None
    ph_value: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class IrrigationRequest(BaseModel):
    soil_feel: str
    application_rate: float
    state_name: str
    district_name: str
    farm_id: str = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

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
            "/api/v1/weather/forecast",
            "/api/v1/weather/analytics",
            "/api/v1/weather/gemini-insights",
            "/api/v1/auth/profile"
        ]
    }

@app.get("/health")
def health():
    return {"status": "healthy", "appwrite": "connected"}

# ========================================
# CROP + IRRIGATION
# ========================================
@app.post("/api/v1/crop/recommend")
def crop_recommend(req: CropRequest):
    result = CropService.recommend_crops(
        soil_type=req.soil_type,
        soil_quality=req.soil_quality,
        state_name=req.state_name,
        district_name=req.district_name,
        n_value=req.n_value,
        p_value=req.p_value,
        k_value=req.k_value,
        ph_value=req.ph_value,
        latitude=req.latitude,
        longitude=req.longitude,
    )
    try:
        appwrite_service.log_crop_prediction("temp_user", "no_farm", result)
    except Exception:
        pass
    return result

@app.post("/api/v1/irrigation/recommend")
def irrigation_recommend(req: IrrigationRequest):
    result = recommend_irrigation_with_weather(
        soil_feel=req.soil_feel,
        application_rate_mm_per_h=req.application_rate,
        state_name=req.state_name,
        district_name=req.district_name,
        latitude=req.latitude,
        longitude=req.longitude,
    )
    try:
        appwrite_service.log_irrigation("temp_user", req.farm_id or "no_farm", result)
    except Exception:
        pass
    return result

@app.post("/api/v1/combined")
def combined_recommend(crop_req: CropRequest, irri_req: IrrigationRequest):
    crop_result = CropService.recommend_crops(
        soil_type=crop_req.soil_type,
        soil_quality=crop_req.soil_quality,
        state_name=crop_req.state_name,
        district_name=crop_req.district_name,
        n_value=crop_req.n_value,
        p_value=crop_req.p_value,
        k_value=crop_req.k_value,
        ph_value=crop_req.ph_value,
        latitude=crop_req.latitude,
        longitude=crop_req.longitude,
    )
    irri_result = recommend_irrigation_with_weather(
        soil_feel=irri_req.soil_feel,
        application_rate_mm_per_h=irri_req.application_rate,
        state_name=irri_req.state_name,
        district_name=irri_req.district_name,
        latitude=irri_req.latitude,
        longitude=irri_req.longitude,
    )
    return {"crop_recommendation": crop_result, "irrigation_recommendation": irri_result}

# ========================================
# WEATHER ENDPOINTS
# ========================================
WEATHER_API_KEY = "985cb1efea8c4871ab5125147252312"
WEATHER_BASE = "https://api.weatherapi.com/v1"

@app.get("/api/geocode")
@app.get("/api/v1/weather/geocode")
async def geocode(q: str):
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
    current_url = f"{WEATHER_BASE}/current.json?key={WEATHER_API_KEY}&q={lat},{lon}&aqi=yes"
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
    astro = forecast_data["forecast"]["forecastday"][0]["astro"]
    day_data = forecast_data["forecast"]["forecastday"][0]["day"]
    
    # Convert wind degree to compass
    degrees = curr["wind_degree"]
    compass_points = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    comp_idx = int((degrees + 11.25) / 22.5) % 16
    wind_dir_label = compass_points[comp_idx]

    # Get AQI (US EPA Index)
    aqi_index = curr.get("air_quality", {}).get("us-epa-index")

    return CurrentWeatherOut(
        location=f"{loc['name']}, {loc['region']}, {loc['country']}",
        coordinates={"lat": loc["lat"], "lon": loc["lon"]},
        temperature=curr["temp_c"],
        feelsLike=curr["feelslike_c"],
        condition=curr["condition"]["text"],
        humidity=curr["humidity"],
        windSpeed=curr["wind_kph"],
        windDirection=wind_dir_label,
        pressure=curr["pressure_mb"],
        visibility=curr["vis_km"],
        uvIndex=curr["uv"],
        aqi=aqi_index,
        precipMm=curr.get("precip_mm", 0),
        rainChance=day_data.get("daily_chance_of_rain", 0),
        sunrise=astro["sunrise"],
        sunset=astro["sunset"],
        lastUpdated=curr["last_updated"]
    )

@app.get("/api/v1/weather/forecast", response_model=ForecastOut)
async def get_forecast(lat: float, lon: float, days: int = Query(7, ge=1, le=14)):
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

@app.get("/api/v1/weather/analytics", response_model=WeatherAnalyticsOut)
async def get_weather_analytics(lat: float, lon: float, days: int = Query(7, ge=1, le=14)):
    url = f"{WEATHER_BASE}/forecast.json?key={WEATHER_API_KEY}&q={lat},{lon}&days={days}"
    async with httpx.AsyncClient() as client:
        res = await client.get(url)
    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail="Weather API error")
    data = res.json()
    forecast_days = data["forecast"]["forecastday"]
    temps = [d["day"]["avgtemp_c"] for d in forecast_days]
    highs = [d["day"]["maxtemp_c"] for d in forecast_days]
    lows = [d["day"]["mintemp_c"] for d in forecast_days]
    rain = [d["day"].get("totalprecip_mm", 0) for d in forecast_days]
    hum = [d["day"]["avghumidity"] for d in forecast_days]
    wind = [d["day"]["maxwind_kph"] for d in forecast_days]
    extreme_days = sum(1 for d in forecast_days if d["day"]["maxtemp_c"] > 35 or d["day"].get("totalprecip_mm", 0) > 15)
    return WeatherAnalyticsOut(
        avgTemp=sum(temps) / len(temps) if temps else 0,
        maxTemp=max(highs) if highs else 0,
        minTemp=min(lows) if lows else 0,
        totalRainfall=sum(rain),
        avgHumidity=int(sum(hum) / len(hum)) if hum else 0,
        avgWindSpeed=sum(wind) / len(wind) if wind else 0,
        extremeDays=extreme_days
    )

@app.post("/api/v1/weather/gemini-insights", response_model=GeminiInsightsOut)
async def get_gemini_insights(req: GeminiRequest):
    """Provide agricultural insights (placeholder for actual Gemini AI)"""
    return GeminiInsightsOut(
        summary={"text": "The upcoming week shows stable temperatures with low rainfall probability. Ideal for harvesting activities and preparing soil for the next cycle."},
        recommendations=[
            {"title": "Irrigation Plan", "text": "Soil moisture is expected to decrease. Schedule deep irrigation on Day 3."},
            {"title": "Pest Watch", "text": "Stable warm weather may increase aphid activity. Monitor crops closely."},
            {"title": "Harvesting", "text": "Low humidity windows on Days 5-7 are perfect for harvesting grains."}
        ]
    )


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


# ========================================
# ML MODEL STUDIO & TRAINING
# ========================================
class TrainingRequest(BaseModel):
    model_type: str
    n_estimators: Optional[int] = 100
    max_depth: Optional[int] = None
    min_samples_split: Optional[int] = 2

@app.get("/api/v1/ml/metrics")
def get_ml_metrics():
    try:
        metrics = TrainingService.get_current_metrics()
        return {"success": True, "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/ml/train")
def train_ml_model(req: TrainingRequest):
    try:
        metrics = TrainingService.train_model(
            model_type=req.model_type,
            n_estimators=req.n_estimators or 100,
            max_depth=req.max_depth,
            min_samples_split=req.min_samples_split or 2
        )
        return {"success": True, "message": f"{req.model_type} model trained and deployed successfully!", "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
