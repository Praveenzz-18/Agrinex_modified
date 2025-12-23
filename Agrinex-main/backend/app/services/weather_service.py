import os
import requests
from datetime import datetime
from typing import Dict, Tuple

OPENMETEO_URL = "https://api.open-meteo.com/v1/forecast"

def get_openmeteo_weather(lat: float, lon: float) -> Dict:
    """
    Fetch current weather + 24h rain from Open-Meteo (FREE, no API key).
    """
    try:
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "temperature_2m,relative_humidity_2m,precipitation",
            "forecast_days": 1,
            "timezone": "auto",
        }
        r = requests.get(OPENMETEO_URL, params=params, timeout=5)
        r.raise_for_status()
        data = r.json()

        hours = data["hourly"]["time"]
        temps = data["hourly"]["temperature_2m"]
        hums = data["hourly"]["relative_humidity_2m"]
        prec = data["hourly"]["precipitation"]

        # take last (most recent) hour as current
        temperature = temps[-1]
        humidity = hums[-1]
        rain_24h = sum(prec)  # sum of all hourly precipitation

        return {
            "temperature": temperature,
            "humidity": humidity,
            "rain_24h": rain_24h,
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        # Fallback defaults
        return {
            "temperature": 25.0,
            "humidity": 60.0,
            "rain_24h": 0.0,
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
        }


def map_location_to_coords(state: str, district: str) -> Tuple[float, float]:
    """
    Hardcoded mapping of Indian state/district to lat/lon.
    For full coverage, use the Kaggle dataset: 
    https://www.kaggle.com/datasets/sirpunch/district-level-longitude-latitude-for-india
    """
    location_map = {
    # Chhattisgarh
    ("chhattisgarh", "durg"): (21.1939, 81.2740),
    ("chhattisgarh", "raipur"): (21.2514, 81.6296),
    ("chhattisgarh", "bilaspur"): (22.0796, 82.1590),
    ("chhattisgarh", "rajnandgaon"): (22.5596, 81.3089),
    
    # Maharashtra
    ("maharashtra", "pune"): (18.5204, 73.8567),
    ("maharashtra", "mumbai"): (19.0760, 72.8777),
    ("maharashtra", "nagpur"): (21.1458, 79.0882),
    ("maharashtra", "aurangabad"): (19.8762, 75.3433),
    ("maharashtra", "nashik"): (19.9975, 73.7898),
    ("maharashtra", "kolhapur"): (16.7050, 74.2433),
    
    # Delhi
    ("delhi", "delhi"): (28.7041, 77.1025),
    
    # Karnataka (Major Districts)
    ("karnataka", "bangalore"): (12.9716, 77.5946),
    ("karnataka", "bengaluru"): (12.9716, 77.5946),  # alternate name
    ("karnataka", "belagavi"): (15.8497, 74.4977),   # Belgaum
    ("karnataka", "belgaum"): (15.8497, 74.4977),    # alternate name
    ("karnataka", "ballari"): (15.1400, 76.6200),    # Bellary
    ("karnataka", "bellary"): (15.1400, 76.6200),    # alternate name
    ("karnataka", "dharwad"): (15.4589, 75.1342),    # Dharwar
    ("karnataka", "dharwar"): (15.4589, 75.1342),    # alternate name
    ("karnataka", "hubballi"): (15.3647, 75.1240),   # Hubli
    ("karnataka", "hubli"): (15.3647, 75.1240),      # alternate name
    ("karnataka", "gulbarga"): (17.3265, 76.4304),   # Kalaburagi
    ("karnataka", "kalaburagi"): (17.3265, 76.4304), # new name
    ("karnataka", "tumkur"): (13.2173, 77.1145),
    ("karnataka", "tumkuru"): (13.2173, 77.1145),    # alternate spelling
    ("karnataka", "mysore"): (12.2958, 76.6394),
    ("karnataka", "mysuru"): (12.2958, 76.6394),     # new name
    ("karnataka", "mandya"): (12.5353, 76.8970),
    ("karnataka", "hassan"): (13.3352, 75.9103),
    ("karnataka", "chikmagalur"): (13.3181, 75.7708),
    ("karnataka", "kodagu"): (12.3381, 75.7273),
    ("karnataka", "coorg"): (12.3381, 75.7273),      # alternate name
    ("karnataka", "udupi"): (13.3408, 74.7421),
    ("karnataka", "dakshina kannada"): (12.6689, 75.3692),
    ("karnataka", "mangalore"): (12.8658, 74.8440),
    ("karnataka", "mangaluru"): (12.8658, 74.8440),  # new name
    ("karnataka", "uttara kannada"): (14.4505, 74.6660),
    ("karnataka", "chitradurga"): (14.2267, 75.6760),
    ("karnataka", "chikballapur"): (13.4359, 77.7297),
    ("karnataka", "kolar"): (13.1359, 78.1304),
    ("karnataka", "ramanagara"): (12.7667, 77.2833),
    ("karnataka", "davangere"): (14.4667, 75.9167),
    ("karnataka", "davanagere"): (14.4667, 75.9167),
    ("karnataka", "shimoga"): (13.9299, 75.5681),
    ("karnataka", "shivamogga"): (13.9299, 75.5681),
    ("karnataka", "vikarabad"): (16.9891, 77.1331),
    ("karnataka", "yadgir"): (16.7669, 77.1391),
    ("karnataka", "bagalkot"): (16.1703, 75.6667),
    ("karnataka", "bijapur"): (16.8302, 75.7053),
    ("karnataka", "vijayapura"): (16.8302, 75.7053),
    
    # Tamil Nadu
    ("tamil nadu", "chennai"): (13.0827, 80.2707),
    ("tamil nadu", "coimbatore"): (11.0168, 76.9558),
    ("tamil nadu", "madurai"): (9.9252, 78.1198),
    ("tamil nadu", "salem"): (11.6643, 78.1460),
    ("tamil nadu", "tiruppur"): (11.3889, 77.3411),
    ("tamil nadu", "erode"): (11.3919, 77.7172),
    ("tamil nadu", "trichy"): (10.7905, 78.7047),
    ("tamil nadu", "thanjavur"): (10.7870, 79.1378),
    
    # Telangana
    ("telangana", "hyderabad"): (17.3850, 78.4867),
    ("telangana", "warangal"): (17.9689, 79.5941),
    ("telangana", "nizamabad"): (19.2705, 78.0945),
    
    # Andhra Pradesh
    ("andhra pradesh", "visakhapatnam"): (17.6868, 83.2185),
    ("andhra pradesh", "vijayawada"): (16.5062, 80.6480),
    ("andhra pradesh", "tirupati"): (13.1939, 79.8941),
    
    # Uttar Pradesh
    ("uttar pradesh", "lucknow"): (26.8467, 80.9462),
    ("uttar pradesh", "kanpur"): (26.4499, 80.3319),
    ("uttar pradesh", "varanasi"): (25.3176, 82.9739),
    ("uttar pradesh", "agra"): (27.1767, 78.0081),
    
    # West Bengal
    ("west bengal", "kolkata"): (22.5726, 88.3639),
    ("west bengal", "darjeeling"): (27.0410, 88.2663),
    ("west bengal", "siliguri"): (26.7271, 88.3953),
    
    # Gujarat
    ("gujarat", "surat"): (21.1702, 72.8311),
    ("gujarat", "ahmedabad"): (23.0225, 72.5714),
    ("gujarat", "vadodara"): (22.3072, 73.1812),
    ("gujarat", "rajkot"): (22.3039, 70.8022),
    
    # Rajasthan
    ("rajasthan", "jaipur"): (26.9124, 75.7873),
    ("rajasthan", "jodhpur"): (26.2389, 73.0243),
    ("rajasthan", "ajmer"): (26.4499, 74.6399),
    ("rajasthan", "udaipur"): (24.5854, 73.7125),
    
    # Madhya Pradesh
    ("madhya pradesh", "bhopal"): (23.2599, 77.4126),
    ("madhya pradesh", "indore"): (22.7196, 75.8577),
    ("madhya pradesh", "gwalior"): (26.2389, 78.1770),
    ("madhya pradesh", "jabalpur"): (23.1815, 79.9864),
    
    # Bihar
    ("bihar", "patna"): (25.5941, 85.1376),
    ("bihar", "gaya"): (24.7955, 84.9994),
    ("bihar", "bhagalpur"): (25.2820, 86.4728),
    
    # Haryana
    ("haryana", "gurugram"): (28.4595, 77.0266),
    ("haryana", "faridabad"): (28.4089, 77.3178),
    ("haryana", "hisar"): (29.1461, 75.7337),
    
    # Punjab
    ("punjab", "ludhiana"): (30.9009, 75.8573),
    ("punjab", "amritsar"): (31.6340, 74.8723),
    ("punjab", "jalandhar"): (31.7260, 75.5762),
    ("punjab", "chandigarh"): (30.7333, 76.7794),
    
    # Odisha
    ("odisha", "bhubaneswar"): (20.2961, 85.8245),
    ("odisha", "cuttack"): (20.4625, 85.8830),
    ("odisha", "rourkela"): (22.2271, 84.8537),
    
    # Assam
    ("assam", "guwahati"): (26.1863, 91.7668),
    ("assam", "dibrugarh"): (27.4728, 94.9119),
    
    # Uttaranchal
    ("uttaranchal", "dehradun"): (30.3165, 78.0322),
    ("uttarakhand", "dehradun"): (30.3165, 78.0322),
    ("uttaranchal", "nainital"): (29.3804, 79.4608),
    ("uttarakhand", "nainital"): (29.3804, 79.4608),
    
    # Himachal Pradesh
    ("himachal pradesh", "shimla"): (31.1048, 77.1734),
    ("himachal pradesh", "manali"): (32.2541, 77.1882),
    ("himachal pradesh", "mandi"): (31.5885, 76.9386),
    
    # Meghalaya
    ("meghalaya", "shillong"): (25.5687, 91.8832),
    
    # Tripura
    ("tripura", "agartala"): (23.8317, 91.2868),
    
    # Mizoram
    ("mizoram", "aizawl"): (23.7148, 92.7299),
    
    # Nagaland
    ("nagaland", "kohima"): (25.6782, 94.1115),
    
    # Arunachal Pradesh
    ("arunachal pradesh", "itanagar"): (27.1767, 93.6926),
    
    # Sikkim
    ("sikkim", "gangtok"): (27.7022, 88.5630),
    
    # Kerala
    ("kerala", "thiruvananthapuram"): (8.5241, 76.9366),
    ("kerala", "kochi"): (9.9312, 76.2673),
    ("kerala", "kozhikode"): (11.2588, 75.7804),
    
    # Goa
    ("goa", "panaji"): (15.2993, 74.1240),
    ("goa", "margao"): (15.2833, 73.9500),
    
    # Puducherry
    ("puducherry", "pondicherry"): (11.9416, 79.8084),
    
    # Jammu and Kashmir
    ("jammu and kashmir", "srinagar"): (34.0837, 74.8070),
    ("jammu and kashmir", "jammu"): (32.7266, 75.8472),
    
    # Ladakh
    ("ladakh", "leh"): (34.1526, 77.5794),
    ("ladakh", "kargil"): (34.5543, 76.1119),
    
    # Andaman and Nicobar
    ("andaman and nicobar islands", "port blair"): (11.7401, 92.7673),
}

    
    key = (state.strip().lower(), district.strip().lower())
    if key in location_map:
        return location_map[key]
    
    # Default: center of India
    return 20.0, 78.0
