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

class WeatherAllOut(BaseModel):
    current: CurrentWeatherOut
    forecast: ForecastOut
    analytics: WeatherAnalyticsOut

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
            "/api/v1/weather/all",
            "/api/v1/weather/current",
            "/api/v1/weather/forecast",
            "/api/v1/weather/analytics",
            "/api/v1/weather/gemini-insights",
            "/api/geocode",
            "/api/v1/weather/geocode",
            "/api/v1/auth/profile"
        ]
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

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

def get_condition_text(code):
    mapping = {
        0: "Clear", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing Rime Fog", 51: "Light Drizzle", 53: "Moderate Drizzle",
        55: "Dense Drizzle", 56: "Light Freezing Drizzle", 57: "Dense Freezing Drizzle",
        61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain", 66: "Light Freezing Rain",
        67: "Heavy Freezing Rain", 71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
        77: "Snow Grains", 80: "Slight Rain Showers", 81: "Moderate Rain Showers",
        82: "Violent Rain Showers", 85: "Slight Snow Showers", 86: "Heavy Snow Showers",
        95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
    }
    return mapping.get(code, "Unknown")

def get_wind_dir(degrees):
    if degrees is None: return "N"
    compass_points = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    comp_idx = int((degrees + 11.25) / 22.5) % 16
    return compass_points[comp_idx]

@app.get("/api/geocode")
@app.get("/api/v1/weather/geocode")
async def geocode(q: str):
    results = []
    headers = {"User-Agent": "Agrinex-App/1.0"}
    
    print(f"[GEOCODE] Received query: {q!r}")
    # Check if q is a coordinate string like '12.9716,77.5946'
    is_coords = False
    try:
        parts = [p.strip() for p in q.split(",")]
        if len(parts) >= 2:
            lat_val = float(parts[0])
            lon_val = float(parts[1])
            is_coords = True
    except ValueError:
        pass
        
    print(f"[GEOCODE] is_coords={is_coords}")
    async with httpx.AsyncClient() as client:
        if is_coords:
            # Reverse geocoding
            url = f"https://nominatim.openstreetmap.org/reverse?lat={lat_val}&lon={lon_val}&format=json&addressdetails=1"
            print(f"[GEOCODE] Reverse geocoding URL: {url}")
            res = await client.get(url, headers=headers)
            print(f"[GEOCODE] Nominatim status_code: {res.status_code}")
            if res.status_code == 200:
                loc = res.json()
                print(f"[GEOCODE] Nominatim response: {loc}")
                addr = loc.get("address", {})
                name = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("suburb") or addr.get("municipality") or addr.get("county") or loc.get("name", "")
                results.append({
                    "name": name,
                    "region": addr.get("state", ""),
                    "country": addr.get("country", ""),
                    "lat": float(loc.get("lat", lat_val)),
                    "lon": float(loc.get("lon", lon_val))
                })
        else:
            # Forward geocoding
            url = f"https://nominatim.openstreetmap.org/search?q={q}&format=json&limit=5&addressdetails=1"
            print(f"[GEOCODE] Forward geocoding URL: {url}")
            res = await client.get(url, headers=headers)
            print(f"[GEOCODE] Nominatim status_code: {res.status_code}")
            if res.status_code == 200:
                data = res.json()
                print(f"[GEOCODE] Nominatim response count: {len(data)}")
                for loc in data:
                    addr = loc.get("address", {})
                    name = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("suburb") or addr.get("municipality") or addr.get("county") or loc.get("name", "")
                    results.append({
                        "name": name,
                        "region": addr.get("state", ""),
                        "country": addr.get("country", ""),
                        "lat": float(loc.get("lat", 0)),
                        "lon": float(loc.get("lon", 0))
                    })
                    
    print(f"[GEOCODE] Returning results: {results}")
    return {"results": results}


_weather_cache: Dict[Any, Any] = {}

async def fetch_open_meteo(lat: float, lon: float, days: int = 7):
    now = datetime.utcnow().timestamp()
    lat_k = round(lat, 3)
    lon_k = round(lon, 3)

    # Check for valid cached data with at least requested number of days (5 min TTL)
    for (c_lat, c_lon, c_days), (cached_data, timestamp) in list(_weather_cache.items()):
        if c_lat == lat_k and c_lon == lon_k and c_days >= days:
            if now - timestamp < 300:
                return cached_data

    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days={days}"
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, timeout=10.0)
        if res.status_code == 200:
            data = res.json()
            _weather_cache[(lat_k, lon_k, days)] = (data, now)
            return data
        
        # If rate limited (429) or error from Open-Meteo, serve stale cache if any exists
        for (c_lat, c_lon, _), (cached_data, _) in list(_weather_cache.items()):
            if c_lat == lat_k and c_lon == lon_k:
                return cached_data
        raise HTTPException(status_code=res.status_code, detail="Weather API error")
    except httpx.RequestError as exc:
        for (c_lat, c_lon, _), (cached_data, _) in list(_weather_cache.items()):
            if c_lat == lat_k and c_lon == lon_k:
                return cached_data
        raise HTTPException(status_code=503, detail=f"Weather service unavailable: {str(exc)}")

@app.get("/api/v1/weather/all", response_model=WeatherAllOut)
async def get_all_weather(lat: float, lon: float, days: int = Query(7, ge=1, le=14)):
    data = await fetch_open_meteo(lat, lon, days)
    curr = data.get("current", {})
    daily = data.get("daily", {})

    current = CurrentWeatherOut(
        location="Farm Location",
        coordinates={"lat": lat, "lon": lon},
        temperature=curr.get("temperature_2m", 0),
        feelsLike=curr.get("apparent_temperature", 0),
        condition=get_condition_text(curr.get("weather_code", 0)),
        humidity=curr.get("relative_humidity_2m", 0),
        windSpeed=curr.get("wind_speed_10m", 0),
        windDirection=get_wind_dir(curr.get("wind_direction_10m", 0)),
        pressure=curr.get("surface_pressure", 0),
        visibility=10,
        uvIndex=daily.get("uv_index_max", [0])[0] if daily.get("uv_index_max") else 0,
        aqi=1,
        precipMm=curr.get("precipitation", 0),
        rainChance=daily.get("precipitation_probability_max", [0])[0] if daily.get("precipitation_probability_max") else 0,
        sunrise=daily.get("sunrise", [""])[0].split("T")[-1] if daily.get("sunrise") else "",
        sunset=daily.get("sunset", [""])[0].split("T")[-1] if daily.get("sunset") else "",
        lastUpdated=curr.get("time", "").replace("T", " ")
    )

    forecast_days = []
    if "time" in daily:
        for i in range(len(daily["time"])):
            forecast_days.append(ForecastDay(
                date=daily["time"][i],
                high=daily["temperature_2m_max"][i],
                low=daily["temperature_2m_min"][i],
                condition=get_condition_text(daily["weather_code"][i]),
                rainChance=daily["precipitation_probability_max"][i],
                rainAmount=daily["precipitation_sum"][i],
                humidity=int(daily["relative_humidity_2m_mean"][i]) if "relative_humidity_2m_mean" in daily and daily["relative_humidity_2m_mean"] else 50,
                windSpeed=daily["wind_speed_10m_max"][i],
                isToday=(i == 0)
            ))
    forecast = ForecastOut(days=forecast_days)

    if not daily or "temperature_2m_max" not in daily:
        analytics = WeatherAnalyticsOut(avgTemp=0, maxTemp=0, minTemp=0, totalRainfall=0, avgHumidity=0, avgWindSpeed=0, extremeDays=0)
    else:
        highs = daily["temperature_2m_max"]
        lows = daily["temperature_2m_min"]
        temps = [(h+l)/2 for h, l in zip(highs, lows)]
        rain = daily["precipitation_sum"]
        wind = daily["wind_speed_10m_max"]
        extreme_days = sum(1 for h, r in zip(highs, rain) if h > 35 or r > 15)
        avg_humidity = 50
        if "relative_humidity_2m_mean" in daily and daily["relative_humidity_2m_mean"]:
            valid_humidity = [h for h in daily["relative_humidity_2m_mean"] if h is not None]
            if valid_humidity:
                avg_humidity = int(sum(valid_humidity) / len(valid_humidity))

        analytics = WeatherAnalyticsOut(
            avgTemp=sum(temps) / len(temps) if temps else 0,
            maxTemp=max(highs) if highs else 0,
            minTemp=min(lows) if lows else 0,
            totalRainfall=sum(rain),
            avgHumidity=avg_humidity,
            avgWindSpeed=sum(wind) / len(wind) if wind else 0,
            extremeDays=extreme_days
        )

    return {
        "current": current,
        "forecast": forecast,
        "analytics": analytics
    }

@app.get("/api/v1/weather/current", response_model=CurrentWeatherOut)
async def get_current_weather(lat: float, lon: float):
    weather_data = await get_all_weather(lat, lon, 1)
    return weather_data["current"]

@app.get("/api/v1/weather/forecast", response_model=ForecastOut)
async def get_forecast(lat: float, lon: float, days: int = Query(7, ge=1, le=14)):
    weather_data = await get_all_weather(lat, lon, days)
    return weather_data["forecast"]

@app.get("/api/v1/weather/analytics", response_model=WeatherAnalyticsOut)
async def get_weather_analytics(lat: float, lon: float, days: int = Query(7, ge=1, le=14)):
    weather_data = await get_all_weather(lat, lon, days)
    return weather_data["analytics"]

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
    model_config = {"protected_namespaces": ()}
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
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
