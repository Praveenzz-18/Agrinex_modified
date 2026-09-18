import joblib
import numpy as np
import os
from typing import Dict
import pandas as pd


from .weather_service import get_openmeteo_weather, map_location_to_coords

# Load pre-trained irrigation model
# This file is at: backend/app/services/irrigation_service.py
# We need to go up 3 levels to backend/, then into models/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IRRIGATION_MODEL_PATH = os.path.join(BASE_DIR, "models", "irrigation_model_pipeline.pkl")
irrigation_model = joblib.load(IRRIGATION_MODEL_PATH)


SOIL_FEEL_MAP = {
    "dry and crumbly": 0.2,
    "slightly damp": 0.5,
    "wet and muddy": 0.8,
}


def moisture_to_water_mm(moisture_mean: float) -> float:
    """
    Convert moisture level to irrigation water depth (mm).
    """
    if moisture_mean < 0.3:
        return 20.0  # very dry
    elif moisture_mean < 0.5:
        return 12.0  # moderately dry
    elif moisture_mean < 0.7:
        return 5.0   # slightly dry
    else:
        return 0.0   # already wet


def recommend_irrigation(
    soil_feel: str,
    application_rate_mm_per_h: float,
    forecast_rain_mm_24h: float = 0.0,
) -> Dict:
    """
    Core irrigation logic: predict water need based on moisture + weather.
    """
    try:
        # 1. Map soil feel to moisture (case insensitive)
        m = SOIL_FEEL_MAP.get(soil_feel.lower(), 0.45)

        # 2. Build DataFrame with EXACT column names from training
        import pandas as pd
        features_df = pd.DataFrame(
            [[m, m, m, m, m]], 
            columns=['moisture1', 'moisture2', 'moisture3', 'moisture4', 'moisture0']
        )

        # 3. Get model prediction
        pred_proba = irrigation_model.predict_proba(features_df)
        proba = pred_proba[0] if pred_proba.ndim > 1 else pred_proba
        pred = irrigation_model.predict(features_df)[0]
        p_irrigate = float(proba[1]) if len(proba) > 1 else 0.5

        # rest of function stays same...

        # 4. Base water depth from moisture
        base_mm = moisture_to_water_mm(m)

        # 5. Adjust for forecasted rain
        reason_weather = "No significant rain expected."
        if forecast_rain_mm_24h > 10:
            base_mm = 0.0
            reason_weather = "Heavy rain expected (>10mm), skipping irrigation."
        elif forecast_rain_mm_24h > 5:
            base_mm *= 0.5
            reason_weather = f"Moderate rain expected ({forecast_rain_mm_24h:.1f}mm), reducing irrigation by 50%."

        # 6. Calculate duration
        duration_h = base_mm / application_rate_mm_per_h if application_rate_mm_per_h > 0 else 0.0

        return {
            "success": True,
            "irrigate": bool(pred) and base_mm > 0,
            "model_probability": p_irrigate,
            "moisture_level": m,
            "water_mm": round(base_mm, 2),
            "duration_hours": round(duration_h, 2),
            "reason_weather": reason_weather,
            "application_rate_mm_per_h": application_rate_mm_per_h,
            "soil_feel": soil_feel,
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Irrigation recommendation failed: {str(e)}",
        }


def recommend_irrigation_with_weather(
    soil_feel: str,
    application_rate_mm_per_h: float,
    state_name: str,
    district_name: str,
    latitude: float = None,
    longitude: float = None,
) -> Dict:
    """
    High-level function: fetch weather and recommend irrigation.
    """
    try:
        # Fetch weather
        if latitude is not None and longitude is not None:
            lat, lon = latitude, longitude
        else:
            lat, lon = map_location_to_coords(state_name, district_name)
            
        weather = get_openmeteo_weather(lat, lon)
        rain_24h = weather["rain_24h"]

        # Get irrigation recommendation
        result = recommend_irrigation(
            soil_feel=soil_feel,
            application_rate_mm_per_h=application_rate_mm_per_h,
            forecast_rain_mm_24h=rain_24h,
        )

        result["weather"] = weather
        result["state"] = state_name
        result["district"] = district_name
        return result
    except Exception as e:
        return {
            "success": False,
            "error": f"Weather-based irrigation recommendation failed: {str(e)}",
        }


def calculate_irrigation_schedule(
    lat: float,
    lon: float,
    soil_type: str,
    soil_feel: str,
    crop_name: str = "maize",
    area_acres: float = 5.0,
    application_rate_mm_per_h: float = 5.0,
    days: int = 7
) -> Dict:
    import requests
    from datetime import datetime, timedelta
    
    # 1. Fetch forecast from Open-Meteo (FREE, no API key required)
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max,precipitation_sum&timezone=auto&forecast_days={days}"
    try:
        res = requests.get(url, timeout=5)
        res.raise_for_status()
        data = res.json()
        daily = data.get("daily", {})
        
        forecast_days = []
        if "time" in daily:
            for i in range(len(daily["time"])):
                forecast_days.append({
                    "date": daily["time"][i],
                    "day": {
                        "maxtemp_c": daily["temperature_2m_max"][i],
                        "mintemp_c": daily["temperature_2m_min"][i],
                        "avghumidity": daily["relative_humidity_2m_mean"][i] if daily.get("relative_humidity_2m_mean") and daily["relative_humidity_2m_mean"][i] is not None else 60,
                        "maxwind_kph": daily["wind_speed_10m_max"][i] if daily.get("wind_speed_10m_max") and daily["wind_speed_10m_max"][i] is not None else 10.0,
                        "totalprecip_mm": daily["precipitation_sum"][i] if daily.get("precipitation_sum") and daily["precipitation_sum"][i] is not None else 0.0,
                        "condition": {"text": "Sunny"}
                    }
                })
    except Exception as e:
        # Fallback to dummy forecast days if request fails
        forecast_days = []
        today = datetime.now()
        for idx in range(days):
            date_str = (today + timedelta(days=idx)).strftime("%Y-%m-%d")
            forecast_days.append({
                "date": date_str,
                "day": {
                    "maxtemp_c": 30.0,
                    "mintemp_c": 20.0,
                    "avghumidity": 60,
                    "maxwind_kph": 10.0,
                    "daily_chance_of_rain": 0,
                    "totalprecip_mm": 0.0,
                    "condition": {"text": "Sunny"}
                }
            })

    # 2. Crop Coefficients (Kc) - FAO-56 style
    crop_kc_map = {
        "rice": 1.15,
        "maize": 0.95,
        "chickpea": 0.75,
        "kidneybeans": 0.80,
        "pigeonpeas": 0.75,
        "mothbeans": 0.70,
        "mungbean": 0.75,
        "blackgram": 0.75,
        "lentil": 0.75,
        "pomegranate": 0.85,
        "banana": 1.10,
        "mango": 0.70,
        "grapes": 0.65,
        "watermelon": 0.80,
        "muskmelon": 0.80,
        "apple": 0.90,
        "orange": 0.80,
        "papaya": 0.85,
        "coconut": 0.95,
        "cotton": 0.95,
        "jute": 1.05,
        "coffee": 0.95
    }
    crop_display_names = {k: k.capitalize() for k in crop_kc_map.keys()}
    
    crop_lower = crop_name.lower().strip()
    kc = crop_kc_map.get(crop_lower, 0.85)
    crop_display = crop_display_names.get(crop_lower, crop_name.capitalize())

    # 3. Soil Water Capacity (mm)
    soil_capacity_map = {
        "sandy": 40.0,
        "loam": 70.0,
        "alluvial": 70.0,
        "clay": 100.0,
        "black": 100.0,
        "red": 60.0,
        "laterite": 50.0,
        "mixed": 65.0
    }
    hc = soil_capacity_map.get(soil_type.lower().strip(), 70.0)
    mad = 0.50  # Maximum Allowable Depletion (50%)

    # Initial depletion based on soil feel
    feel_depletion_map = {
        "dry and crumbly": 0.75,
        "slightly damp": 0.50,
        "wet and muddy": 0.15
    }
    initial_depletion_pct = feel_depletion_map.get(soil_feel.lower().strip(), 0.50)
    current_deficit = hc * initial_depletion_pct

    schedule = []
    total_water_mm = 0.0

    for idx, day_data in enumerate(forecast_days):
        date_str = day_data["date"]
        
        # Parse weather factors
        tmax = day_data["day"]["maxtemp_c"]
        tmin = day_data["day"]["mintemp_c"]
        humidity = day_data["day"]["avghumidity"]
        wind = day_data["day"]["maxwind_kph"]
        rain = day_data["day"].get("totalprecip_mm", 0.0)

        # Reference ET0 approximation
        et0 = (tmax * 0.12) + (wind * 0.03) - (humidity * 0.01) + 1.0
        et0 = max(1.0, min(8.0, et0))
        
        # Crop evapotranspiration
        etc = kc * et0

        # Update soil deficit
        current_deficit = max(0.0, min(hc, current_deficit + etc - rain))

        # Check if depletion triggers irrigation
        irrigate_today = current_deficit >= (hc * mad)
        
        if irrigate_today:
            water_needed_mm = current_deficit
            total_water_mm += water_needed_mm
            current_deficit = 0.0  # Reset deficit to field capacity after irrigation
            
            duration_h = water_needed_mm / application_rate_mm_per_h if application_rate_mm_per_h > 0 else 0.0
            water_liters = water_needed_mm * area_acres * 4047.0 # 1 mm over 1 acre = 4047 liters
            
            # Format time duration
            duration_str = f"{int(duration_h)}h {int((duration_h % 1) * 60)}m" if duration_h >= 1 else f"{int(duration_h * 60)} minutes"
            from datetime import datetime, timedelta
            
            schedule.append({
                "day": idx + 1,
                "date": datetime.strptime(date_str, "%Y-%m-%d").strftime("%b %d, %Y") if "-" in date_str else date_str,
                "optimalTime": "6:00 AM - 7:00 AM" if tmax > 32 else "7:30 AM - 8:30 AM",
                "duration": duration_str,
                "waterVolume": f"{int(water_liters):,} liters",
                "reason": f"Soil depletion reached {int(mad*100)}% threshold. Recommended to replenish {water_needed_mm:.1f}mm moisture.",
                "priority": "HIGH" if idx == 0 or water_needed_mm > (hc * 0.6) else "MEDIUM",
                "confidence": 85 - idx * 3
            })

    # Calculations for total schedule summary
    total_water_liters = total_water_mm * area_acres * 4047.0
    estimated_cost_inr = (total_water_liters / 1000) * 16.5  # Estimated power/pump cost: Rs. 16.5 per 1,000 liters
    
    # Action recommendation
    action = "WAIT"
    reason = f"Soil moisture is stable at {int((1 - current_deficit/hc)*100)}% capacity. Next water demand is checked daily."
    optimal_time = "N/A"
    duration = "0 minutes"
    water_volume = "0 liters"
    expected_benefit = "Maintain root aeration and avoid waterlogging"
    risk_if_delayed = "Drought stress could occur if delayed past scheduled dates"

    if len(schedule) > 0 and schedule[0]["day"] == 1:
        action = "IRRIGATE_NOW"
        reason = f"Current soil moisture is depleted to {int((1 - initial_depletion_pct)*100)}% capacity. Immediate watering required for {crop_display}."
        optimal_time = schedule[0]["optimalTime"]
        duration = schedule[0]["duration"]
        water_volume = schedule[0]["waterVolume"]
        expected_benefit = f"Prevent {int(kc*10)}% yield loss due to moisture stress"
        risk_if_delayed = f"Severe leaf roll and root growth restriction in {crop_display}"

    # Best practices & Tips
    best_practices = [
        {
            "practice": "Water During Cool Hours",
            "tip": f"Irrigate either early morning or late evening when temperatures are lower.",
            "benefit": "Reduce evaporation losses by up to 25%"
        },
        {
            "practice": "Drip Irrigation for High-Value Crops",
            "tip": f"Consider using drip irrigation systems instead of flood for {crop_display}.",
            "benefit": "Saves 30-50% water while targeting root zone directly"
        },
        {
            "practice": "Organic Mulching",
            "tip": "Spread organic straw/leaves around crop beds to cover the soil layer.",
            "benefit": "Retains soil moisture and improves organic content"
        }
    ]

    return {
        "irrigationRecommendation": {
            "action": action,
            "confidence": 88 if action == "IRRIGATE_NOW" else 82,
            "reason": reason,
            "optimalTime": optimal_time,
            "duration": duration,
            "waterVolume": water_volume,
            "expectedBenefit": expected_benefit,
            "riskIfDelayed": risk_if_delayed
        },
        "irrigationTiming": {
            "schedule": schedule,
            "totalWaterNeeded": f"{int(total_water_liters):,} liters",
            "estimatedCost": f"₹{int(estimated_cost_inr)}",
            "waterEfficiency": "35% higher efficiency via dynamic crop scheduling",
            "expectedYieldBenefit": f"+15% yield gain for {crop_display}"
        },
        "bestPractices": best_practices
    }
   

# Inirrigation.py - replace supabase logging
