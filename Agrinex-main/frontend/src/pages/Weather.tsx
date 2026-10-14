import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
// @ts-ignore
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Micro Weather Forecasting Page
 * 
 * Backend Integration Notes:
 * - Fetch logged-in user's farm location from auth context/API
 * - Replace mock data below with backend API calls
 * - Use useEffect to fetch data when forecastDays changes
 * - Map API response to the data structures defined below
 * - Add loading states and error handling
 * 
 * Expected Backend Endpoints:
 * - Get user farm: GET /api/user/farm (returns farm location, coordinates)
 * - Current weather: GET /api/weather/current?farmId={id}
 * - Forecast: GET /api/weather/forecast?farmId={id}&days={7|14}
 * - Gemini Insights: POST /api/weather/gemini-insights?farmId={id}&forecastDays={days}
 * 
 * Gemini API Integration:
 * - Backend should call Gemini API with weather data, soil data, crop data
 * - Gemini generates: cultivation action plan, risk alerts, best practices
 * - ML models provide: irrigation timing schedule, yield projections
 * - Combined response includes both ML predictions and Gemini AI analysis
 * 
 * Real-Time Updates:
 * - Use WebSocket or polling (every 5-10 minutes) for live weather updates
 * - ML models + Gemini API will recalculate insights automatically when weather data changes
 * - Example: useEffect(() => { fetchGeminiInsights(); const interval = setInterval(fetchGeminiInsights, 300000); return () => clearInterval(interval); }, [forecastDays, userFarm.id]);
 */

const Weather: React.FC = () => {
  const { user, selectFarm, getSelectedFarm, getSelectedFarmZoneLocks } = useAuth();
  const [forecastDays, setForecastDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const selectedFarm = getSelectedFarm() || (user?.farms && user.farms.length > 0 ? user.farms[0] : null);
  const hasMultipleFarms = (user?.farms.length || 0) > 1;
  const userFarm = selectedFarm || {
    id: 'temp',
    name: 'Add Your Farm',
    location: '',
    coordinates: '',
    area: 0,
  };
  const [currentWeather, setCurrentWeather] = useState<any>({
    location: userFarm.location,
    coordinates: userFarm.coordinates,
    temperature: 32,
    feelsLike: 35,
    condition: 'Sunny',
    humidity: 65,
    windSpeed: 12,
    windDirection: 'NW',
    pressure: 1013,
    visibility: 10,
    uvIndex: 7,
    sunrise: '6:45 AM',
    sunset: '6:12 PM',
    lastUpdated: '2 minutes ago',
  });
  const [forecastData, setForecastData] = useState<any[]>(
    Array.from({ length: forecastDays }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
      high: 32 + Math.floor(Math.random() * 5),
      low: 22 + Math.floor(Math.random() * 5),
      condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
      rainChance: Math.floor(Math.random() * 100),
      rainAmount: Math.floor(Math.random() * 25),
      humidity: 50 + Math.floor(Math.random() * 30),
      windSpeed: 8 + Math.floor(Math.random() * 10),
    }))
  );
  const [analytics, setAnalytics] = useState<{ avgTemp: number; maxTemp: number; minTemp: number; totalRainfall: number; avgHumidity: number; avgWindSpeed: number; extremeDays: number }>({
    avgTemp: 28,
    maxTemp: 38,
    minTemp: 22,
    totalRainfall: 45,
    avgHumidity: 68,
    avgWindSpeed: 11,
    extremeDays: 2,
  });
  const [gemini, setGemini] = useState<any | null>(null);
  const zoneLocks = getSelectedFarmZoneLocks();
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [zonesForFarm, setZonesForFarm] = useState<Array<{ id: string; area_acres: number; soil_type: string; moisture: number; crop_suggestion: string; suitability: number }>>([]);
  
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsLocationName, setGpsLocationName] = useState<string>('');
  const [isUsingGps, setIsUsingGps] = useState<boolean>(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setGpsCoords({ lat, lon });
        setIsUsingGps(true);
        
        try {
          const geoRes = await api.get(`/api/v1/weather/geocode`, { params: { q: `${lat},${lon}` } });
          const loc = (geoRes.data?.results && geoRes.data.results[0]) || null;
          if (loc) {
            setGpsLocationName(`${loc.name}${loc.region ? ', ' + loc.region : ''}`);
          } else {
            setGpsLocationName(`Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
          }
        } catch (err) {
          setGpsLocationName(`Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert(`Failed to detect location: ${error.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    let cancelled = false;
    const fetchWeatherData = async () => {
      if (!selectedFarm && !isUsingGps) return;
      setLoading(true);
      
      try {
        let lat: number | null = null;
        let lon: number | null = null;
        let locationName = '';

        if (isUsingGps && gpsCoords) {
          lat = gpsCoords.lat;
          lon = gpsCoords.lon;
          locationName = gpsLocationName || 'Current Location';
        } else {
          // 1. Get coordinates from farm setup
          if (selectedFarm?.coordinates) {
            const cleaned = selectedFarm.coordinates.replace(/[^\d\.,\- ]/g, '');
            const parts = cleaned.split(',').map(s => s.trim());
            if (parts.length >= 2) {
              const plat = Number(parts[0]);
              const plon = Number(parts[1]);
              if (!Number.isNaN(plat) && !Number.isNaN(plon)) {
                lat = plat;
                lon = plon;
              }
            }
          }

          // 2. Fallback to geocoding if coordinates are missing
          if (lat === null || lon === null) {
            const geoRes = await api.get(`/api/v1/weather/geocode`, { params: { q: selectedFarm?.location || '' } });
            const loc = (geoRes.data?.results && geoRes.data.results[0]) || null;
            lat = loc?.lat ?? 30.7333; // Default to Chandigarh area as ultimate fallback
            lon = loc?.lon ?? 76.7794;
          }
          
          locationName = selectedFarm?.name || 'Farm Location';
        }

        if (cancelled) return;
        setGeoCoords({ 
          lat: lat ?? 30.7333, 
          lon: lon ?? 76.7794 
        });

        // 3. Fetch Current Weather, Forecast, Analytics, and Gemini Insights sequentially with individual error handling
        // 3a. Current Weather
        try {
          const curRes = await api.get(`/api/v1/weather/current`, { params: { lat, lon } });
          if (!cancelled && curRes.data) {
            const curJson = curRes.data;
            setCurrentWeather({
              location: locationName,
              coordinates: `${lat?.toFixed(4)}, ${lon?.toFixed(4)}`,
              temperature: curJson.temperature,
              feelsLike: curJson.feelsLike,
              condition: curJson.condition,
              humidity: curJson.humidity,
              windSpeed: curJson.windSpeed,
              windDirection: curJson.windDirection,
              pressure: curJson.pressure,
              visibility: curJson.visibility,
              uvIndex: curJson.uvIndex,
              aqi: curJson.aqi,
              precipMm: curJson.precipMm,
              rainChance: curJson.rainChance,
              sunrise: curJson.sunrise,
              sunset: curJson.sunset,
              lastUpdated: curJson.lastUpdated,
            });
          }
        } catch (err) {
          console.error("Error fetching current weather:", err);
        }

        if (cancelled) return;

        // 3b. Forecast
        try {
          const fcRes = await api.get(`/api/v1/weather/forecast`, { params: { lat, lon, days: forecastDays } });
          if (!cancelled && fcRes.data?.days && Array.isArray(fcRes.data.days)) {
            const mappedForecast = fcRes.data.days.map((d: any) => ({
              date: new Date(d.date),
              high: d.high,
              low: d.low,
              condition: d.condition,
              rainChance: d.rainChance,
              rainAmount: d.rainAmount,
              humidity: d.humidity,
              windSpeed: d.windSpeed,
            }));
            setForecastData(mappedForecast);
          }
        } catch (err) {
          console.error("Error fetching weather forecast:", err);
        }

        if (cancelled) return;

        // 3c. Analytics
        try {
          const anRes = await api.get(`/api/v1/weather/analytics`, { params: { lat, lon, days: forecastDays } });
          if (!cancelled && anRes.data) {
            const anJson = anRes.data;
            setAnalytics({
              avgTemp: anJson.avgTemp,
              maxTemp: anJson.maxTemp,
              minTemp: anJson.minTemp,
              totalRainfall: anJson.totalRainfall,
              avgHumidity: anJson.avgHumidity,
              avgWindSpeed: anJson.avgWindSpeed,
              extremeDays: anJson.extremeDays,
            });
          }
        } catch (err) {
          console.error("Error fetching weather analytics:", err);
        }

        if (cancelled) return;

        // 3d. Gemini Insights
        try {
          const gemRes = await api.post(`/api/v1/weather/gemini-insights`, { lat, lon, days: forecastDays });
          if (!cancelled && gemRes.data) {
            setGemini(gemRes.data);
          }
        } catch (err) {
          console.error("Error fetching Gemini insights:", err);
        }

      } catch (err) {
        console.error("Error in weather data lifecycle:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (isUsingGps && !gpsCoords) return;

    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 300000); // 5 minutes refresh
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedFarm?.id, selectedFarm?.coordinates, forecastDays, gpsCoords, isUsingGps]);

  useEffect(() => {
    let cancelled = false;
    const fetchZonesForWeather = async () => {
      if (!selectedFarm || !geoCoords) return;
      try {
        const body = {
          lat: geoCoords.lat,
          lon: geoCoords.lon,
          area_acres: selectedFarm.area ?? 5,
          soil_type: selectedFarm.soilType ?? 'loamy',
          avg_moisture: ((selectedFarm.moisture ?? 50) / 100),
        };
        const res = await api.post('/api/network/zones', body);
        if (cancelled) return;
        setZonesForFarm(res.data?.zones || []);
      } catch {}
    };
    fetchZonesForWeather();
    return () => { cancelled = true; };
  }, [selectedFarm?.id, geoCoords?.lat, geoCoords?.lon]);
  // useEffect(() => {
  //   if (!selectedFarm) return;
  //   
  //   const fetchMLInsights = async () => {
  //     setLoading(true);
  //     try {
  //       // Backend will call Gemini API and combine with ML model predictions
  //       const response = await fetch(`/api/weather/gemini-insights?farmId=${selectedFarm.id}&forecastDays=${forecastDays}`, {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           forecastData,
  //           currentWeather,
  //           soilData: {}, // Add soil data from sensors
  //           cropData: {}, // Add current crop information
  //         })
  //       });
  //       const data = await response.json();
  //       // Response includes: irrigationTiming, cultivationRecommendations, riskAlerts, bestPractices
  //       setMLInsights(data);
  //     } catch (error) {
  //       console.error('Failed to fetch Gemini insights:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   
  //   fetchMLInsights();
  //   // Poll every 5 minutes for real-time updates
  //   const interval = setInterval(fetchMLInsights, 300000);
  //   return () => clearInterval(interval);
  // }, [forecastDays, selectedFarm?.id, forecastData, currentWeather]);

  


  

  const GeminiCard = () => {
    if (!gemini) return null;
    return (
      <div className="card-apple" style={{ padding: 'var(--space-lg)', marginTop: 'var(--space-lg)' }}>
        <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-xs)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✨</span> AI Insights & Recommendations
        </div>
        <div style={{ fontSize: 'var(--body-lg)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
          {gemini.summary?.text || 'No insights'}
        </div>
        {gemini.recommendations && (
          <div style={{ marginTop: 'var(--space-md)', display: 'grid', gap: 'var(--space-sm)' }}>
            {gemini.recommendations.map((rec: any, i: number) => (
              <div key={i} style={{ padding: 'var(--space-sm)', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>{rec.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rec.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  // TODO: Replace with Gemini API integration
  // Backend endpoint: POST /api/weather/gemini-insights
  // Payload: { farmId, forecastData, currentWeather, soilData, cropData }
  // Gemini will generate: cultivation action plan, risk alerts, best practices
  // 
  // Example backend implementation:
  // const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'x-goog-api-key': process.env.GEMINI_API_KEY
  //   },
  //   body: JSON.stringify({
  //     contents: [{
  //       parts: [{
  //         text: `Analyze this weather data for agriculture: ${JSON.stringify({forecastData, currentWeather})} 
  //         Generate: 1) Cultivation action plan, 2) Risk alerts, 3) Best practices`
  //       }]
  //     }]
  //   })
  // });

  // TODO: Replace with real-time ML model insights + Gemini API
  // These will update automatically as weather data changes
  // Backend will combine ML model predictions with Gemini AI analysis
  // mlInsights block removed

  return (
    <section className="section" style={{ paddingTop: 'var(--space-xl)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ fontSize: 'var(--h1)', marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>
            Weather Forecast
          </h1>
          <div style={{ marginTop: 'var(--space-md)' }}></div>
          <p style={{ fontSize: 'var(--body-lg)', color: 'var(--text-secondary)', maxWidth: 'var(--narrow-width)', marginBottom: 'var(--space-sm)' }}>
            Get farm-specific weather predictions for your exact location.
          </p>
        </div>

        {/* User Farm Info & Forecast Period Selector */}
        <div className="card-apple" style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            {/* Farm Selector (if multiple farms) */}
            {hasMultipleFarms && (
              <div>
                <label style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
                  Select Farm
                </label>
                <select
                  value={selectedFarm?.id || ''}
                  onChange={(e) => {
                    setIsUsingGps(false);
                    selectFarm(e.target.value);
                  }}
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--space-xs)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--body)',
                    width: '100%',
                    maxWidth: '400px',
                  }}
                >
                  {user?.farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name} - {farm.location}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
              <div>
                <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-xs)' }}>
                  {isUsingGps ? 'Current GPS Location' : (hasMultipleFarms ? 'Selected Farm' : 'Your Farm Location')}
                </div>
                <div style={{ fontSize: 'var(--h3)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isUsingGps ? 'My Location' : userFarm.name}
                  {isUsingGps && (
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: 'var(--green-light)',
                      border: '1px solid var(--green-primary)'
                    }}>
                      📡 GPS Active
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--body)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {isUsingGps ? gpsLocationName : (userFarm.location ? `${userFarm.location} · ${userFarm.coordinates}` : userFarm.coordinates)}
                </div>
                {!isUsingGps && userFarm.area && userFarm.area > 0 && (
                  <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    Area: {userFarm.area} acres
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                {/* Geolocation Controls */}
                <div>
                  <label style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
                    Geolocation
                  </label>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    <button
                      onClick={handleDetectLocation}
                      className={isUsingGps ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ 
                        padding: 'var(--space-xs) var(--space-md)', 
                        fontSize: 'var(--body)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: isUsingGps ? 'linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)' : undefined
                      }}
                    >
                      📍 {isUsingGps ? 'GPS Detected' : 'Detect GPS'}
                    </button>
                    {isUsingGps && (
                      <button
                        onClick={() => setIsUsingGps(false)}
                        className="btn btn-secondary"
                        style={{ 
                          padding: 'var(--space-xs) var(--space-md)', 
                          fontSize: 'var(--body)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        🏠 Reset to Farm
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-xs)', display: 'block' }}>
                    Forecast Period
                  </label>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    {[7, 14].map((days) => (
                      <button
                        key={days}
                        onClick={() => setForecastDays(days)}
                        className={forecastDays === days ? 'btn btn-primary' : 'btn btn-secondary'}
                        style={{ padding: 'var(--space-xs) var(--space-md)', fontSize: 'var(--body)' }}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Weather */}
        <div className="card-apple" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="pill" style={{ marginBottom: 'var(--space-md)' }}>Current Conditions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-xs)' }}>
                {currentWeather.location}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                {currentWeather.coordinates} · Updated {currentWeather.lastUpdated}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                <div style={{ fontSize: 'var(--h1)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentWeather.temperature}°
                </div>
                <div style={{ fontSize: 'var(--h3)', color: 'var(--text-tertiary)' }}>C</div>
                <div style={{ fontSize: 'var(--body-lg)', color: 'var(--text-secondary)', marginLeft: 'var(--space-sm)' }}>
                  {currentWeather.condition}
                </div>
              </div>
              <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)' }}>
                Feels like {currentWeather.feelsLike}°C
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
              <WeatherMetric icon="💧" label="Humidity" value={`${currentWeather.humidity}%`} />
              <WeatherMetric icon="💨" label="Wind" value={`${currentWeather.windSpeed} km/h ${currentWeather.windDirection || ''}`} />
              <WeatherMetric icon="📊" label="Pressure" value={`${currentWeather.pressure} hPa`} />
              <WeatherMetric icon="☀️" label="UV Index" value={currentWeather.uvIndex} />
              <WeatherMetric icon="🌧️" label="Rain Chance" value={`${currentWeather.rainChance}%`} />
              <WeatherMetric icon="📏" label="Precipitation" value={`${currentWeather.precipMm} mm`} />
              <WeatherMetric 
                icon="🏭" 
                label="AQI (Level)" 
                value={currentWeather.aqi ? `${getAQILabel(currentWeather.aqi)} (${currentWeather.aqi})` : 'N/A'} 
                labelColor={currentWeather.aqi && currentWeather.aqi > 2 ? '#ef4444' : undefined}
              />
              <WeatherMetric icon="🌅" label="Sunrise" value={currentWeather.sunrise} />
              <WeatherMetric icon="🌇" label="Sunset" value={currentWeather.sunset} />
            </div>
          </div>
        </div>

        {/* Zone Irrigation Plan Removed */}


        {/* Forecast Grid */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="pill" style={{ marginBottom: 'var(--space-md)' }}>{forecastDays}-Day Forecast</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-md)' }}>
            {forecastData.map((day, i) => (
              <ForecastDay key={i} day={day} isToday={i === 0} />
            ))}
          </div>
        </div>

        {/* Analytics Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
          <AnalyticsCard
            title="Temperature Analysis"
            icon="🌡️"
            metrics={[
              { label: 'Average', value: `${analytics.avgTemp}°C`, color: 'var(--text-primary)' },
              { label: 'Maximum', value: `${analytics.maxTemp}°C`, color: 'var(--green-light)' },
              { label: 'Minimum', value: `${analytics.minTemp}°C`, color: 'var(--text-tertiary)' },
            ]}
          />
          <AnalyticsCard
            title="Rainfall Summary"
            icon="🌧️"
            metrics={[
              { label: 'Total Expected', value: `${analytics.totalRainfall} mm`, color: 'var(--text-primary)' },
              { label: 'Rainy Days', value: `${forecastData.filter(d => d.rainChance > 50).length} days`, color: 'var(--green-light)' },
              { label: 'Peak Day', value: `${Math.max(...forecastData.map(d => d.rainAmount))} mm`, color: 'var(--text-tertiary)' },
            ]}
          />
          <AnalyticsCard
            title="Environmental Factors"
            icon="🌍"
            metrics={[
              { label: 'Avg Humidity', value: `${analytics.avgHumidity}%`, color: 'var(--text-primary)' },
              { label: 'Avg Wind Speed', value: `${analytics.avgWindSpeed} km/h`, color: 'var(--green-light)' },
              { label: 'Extreme Days', value: `${analytics.extremeDays} days`, color: 'var(--text-tertiary)' },
            ]}
          />
        </div>

        {/* Irrigation Timing Recommendations - ML Model Generated */}
        {/* mlInsights UI block removed to prevent crash as mlInsights state was removed */}

        {/* Temperature Chart */}
        <div className="card-apple" style={{ marginTop: 'var(--space-lg)' }}>
          <div className="pill" style={{ marginBottom: 'var(--space-md)' }}>Temperature Trend</div>
          <TemperatureChart data={forecastData} />
        </div>

        {/* Rainfall Chart */}
        <div className="card-apple" style={{ marginTop: 'var(--space-lg)' }}>
          <div className="pill" style={{ marginBottom: 'var(--space-md)' }}>Rainfall Probability</div>
          <RainfallChart data={forecastData} />
        </div>

        {/* Agriculture Insights */}
        <div className="card-apple" style={{ marginTop: 'var(--space-lg)', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'var(--green-primary)' }}>
          <div className="pill" style={{ marginBottom: 'var(--space-md)', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--green-primary)', color: 'var(--green-light)' }}>
            💡 AI Recommendations
          </div>
          <GeminiCard />

          {/* mlInsights UI removed */}
        </div>
      </div>
    </section>
  );
};

interface WeatherMetricProps {
  icon: string;
  label: string;
  value: string | number;
  labelColor?: string;
}

const getAQILabel = (index: number | null) => {
  if (index === null) return 'N/A';
  const labels = [
    'Good',
    'Moderate',
    'Unhealthy(SG)',
    'Unhealthy',
    'Very Unhealthy',
    'Hazardous'
  ];
  return labels[index - 1] || 'Unknown';
};

const WeatherMetric: React.FC<WeatherMetricProps> = ({ icon, label, value, labelColor }) => (
  <div>
    <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{icon} {label}</div>
    <div style={{ fontSize: 'var(--h3)', fontWeight: 600, color: labelColor || 'var(--text-primary)' }}>{value}</div>
  </div>
);

interface ForecastDayProps {
  day: {
    date: Date;
    high: number;
    low: number;
    condition: string;
    rainChance: number;
    rainAmount: number;
    humidity: number;
    windSpeed: number;
  };
  isToday: boolean;
}

const ForecastDay: React.FC<ForecastDayProps> = ({ day, isToday }) => {
  const dayName = isToday ? 'Today' : day.date.toLocaleDateString('en-US', { weekday: 'short' });
  const date = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      className="card-apple"
      style={{
        padding: 'var(--space-md)',
        textAlign: 'center',
        background: isToday ? 'rgba(16, 185, 129, 0.1)' : undefined,
        borderColor: isToday ? 'var(--green-primary)' : undefined,
      }}
    >
      <div style={{ fontSize: 'var(--body)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
        {dayName}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }}>{date}</div>
      <div style={{ fontSize: 'var(--h2)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
        {day.high}°
      </div>
      <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }}>
        {day.low}°
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>{day.condition}</div>
      <div style={{ fontSize: '11px', color: 'var(--green-light)', marginTop: 'var(--space-xs)' }}>
        💧 {day.rainChance}% ({day.rainAmount}mm)
      </div>
    </div>
  );
};

interface AnalyticsCardProps {
  title: string;
  icon: string;
  metrics: Array<{ label: string; value: string; color: string }>;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, icon, metrics }) => (
  <div className="card-apple">
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
      <span style={{ fontSize: 'var(--h3)' }}>{icon}</span>
      <h3 style={{ fontSize: 'var(--h3)', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
    </div>
    <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
      {metrics.map((metric, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: i > 0 ? 'var(--space-xs)' : 0, borderTop: i > 0 ? '1px solid var(--border-color)' : 'none' }}>
          <span style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)' }}>{metric.label}:</span>
          <span style={{ fontSize: 'var(--body)', fontWeight: 600, color: metric.color }}>{metric.value}</span>
        </div>
      ))}
    </div>
  </div>
);

interface TemperatureChartProps {
  data: Array<{ high: number; low: number; date: Date }>;
}

const TemperatureChart: React.FC<TemperatureChartProps> = ({ data }) => {
  const maxTemp = Math.max(...data.map(d => d.high));
  const minTemp = Math.min(...data.map(d => d.low));
  const range = maxTemp - minTemp;
  const chartHeight = 200;
  const chartWidth = 800; // Base width for SVG coordinate system
  const padding = 40;

  // Calculate points for smooth curves
  const getY = (temp: number) => chartHeight - padding - ((temp - minTemp) / range) * (chartHeight - padding * 2);
  const getX = (index: number, total: number) => (index / (total - 1)) * (chartWidth - padding * 2) + padding;

  // Generate smooth curve paths using quadratic bezier curves
  const createSmoothPath = (values: number[], getY: (val: number) => number) => {
    if (values.length === 0) return '';
    
    let path = `M ${getX(0, values.length)} ${getY(values[0])}`;
    
    for (let i = 1; i < values.length; i++) {
      const x1 = getX(i - 1, values.length);
      const y1 = getY(values[i - 1]);
      const x2 = getX(i, values.length);
      const y2 = getY(values[i]);
      
      // Control point for smooth curve
      const cpX = (x1 + x2) / 2;
      const cpY1 = y1;
      const cpY2 = y2;
      
      path += ` Q ${cpX} ${cpY1}, ${(x1 + x2) / 2} ${(y1 + y2) / 2}`;
      path += ` T ${x2} ${y2}`;
    }
    
    return path;
  };

  const highValues = data.map(d => d.high);
  const lowValues = data.map(d => d.low);
  const highPath = createSmoothPath(highValues, getY);
  const lowPath = createSmoothPath(lowValues, getY);

  // Create area path for gradient fill
  const createAreaPath = (values: number[], getY: (val: number) => number) => {
    const path = createSmoothPath(values, getY);
    const lastX = getX(values.length - 1, values.length);
    const firstX = getX(0, values.length);
    return `${path} L ${lastX} ${chartHeight - padding} L ${firstX} ${chartHeight - padding} Z`;
  };

  return (
    <div style={{ width: '100%', margin: 'var(--space-sm) 0' }}>
      <div style={{ position: 'relative', width: '100%', height: `${chartHeight}px` }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="tempHighGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--green-light)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--green-primary)" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="tempLowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--green-primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--green-dark)" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Area fill for high temps */}
          <path
            d={createAreaPath(highValues, getY)}
            fill="url(#tempHighGradient)"
            style={{ transition: 'all 0.6s ease' }}
          />
          
          {/* Area fill for low temps */}
          <path
            d={createAreaPath(lowValues, getY)}
            fill="url(#tempLowGradient)"
            style={{ transition: 'all 0.6s ease' }}
          />
          
          {/* High temperature curve */}
          <path
            d={highPath}
            fill="none"
            stroke="var(--green-light)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: 'all 0.6s ease' }}
          />
          
          {/* Low temperature curve */}
          <path
            d={lowPath}
            fill="none"
            stroke="var(--green-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: 'all 0.6s ease' }}
          />
          
          {/* Data points */}
          {data.map((day, i) => {
            const x = getX(i, data.length);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={getY(day.high)}
                  r="4"
                  fill="var(--green-light)"
                  stroke="var(--bg-card)"
                  strokeWidth="2"
                  style={{ transition: 'all 0.6s ease' }}
                />
                <circle
                  cx={x}
                  cy={getY(day.low)}
                  r="4"
                  fill="var(--green-primary)"
                  stroke="var(--bg-card)"
                  strokeWidth="2"
                  style={{ transition: 'all 0.6s ease' }}
                />
                {/* Tooltip on hover */}
                <title>{`${day.date.toLocaleDateString()}: High ${day.high}°C, Low ${day.low}°C`}</title>
              </g>
            );
          })}
        </svg>
        
        {/* Temperature labels */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 var(--space-xs)' }}>
          {data.map((day, i) => (
            <div key={i} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '10px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '2px' }}>
                {day.high}°
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
                {day.low}°
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Day labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', paddingTop: 'var(--space-md)' }}>
        {data.map((day, i) => (
          <div key={i} style={{ textAlign: 'center', flex: 1 }}>
            {i === 0 ? 'Today' : day.date.toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
        ))}
      </div>
    </div>
  );
};

interface RainfallChartProps {
  data: Array<{ rainChance: number; rainAmount: number; date: Date }>;
}

const RainfallChart: React.FC<RainfallChartProps> = ({ data }) => {
  const maxRain = Math.max(...data.map(d => d.rainAmount), 1);
  const chartHeight = 180;
  const chartWidth = 800; // Base width for SVG coordinate system
  const padding = 40;

  // Calculate points for smooth curves
  const getY = (amount: number) => chartHeight - padding - (amount / maxRain) * (chartHeight - padding * 2);
  const getX = (index: number, total: number) => (index / (total - 1)) * (chartWidth - padding * 2) + padding;

  // Generate smooth curve path
  const createSmoothPath = (values: number[], getY: (val: number) => number) => {
    if (values.length === 0) return '';
    
    let path = `M ${getX(0, values.length)} ${chartHeight - padding}`;
    path += ` L ${getX(0, values.length)} ${getY(values[0])}`;
    
    for (let i = 1; i < values.length; i++) {
      const x1 = getX(i - 1, values.length);
      const y1 = getY(values[i - 1]);
      const x2 = getX(i, values.length);
      const y2 = getY(values[i]);
      
      const cpX = (x1 + x2) / 2;
      path += ` Q ${cpX} ${y1}, ${cpX} ${(y1 + y2) / 2}`;
      path += ` T ${x2} ${y2}`;
    }
    
    // Close the path
    const lastX = getX(values.length - 1, values.length);
    path += ` L ${lastX} ${chartHeight - padding} Z`;
    
    return path;
  };

  const rainAmounts = data.map(d => d.rainAmount);
  const areaPath = createSmoothPath(rainAmounts, getY);

  // Create line path for the curve
  const createLinePath = (values: number[], getY: (val: number) => number) => {
    if (values.length === 0) return '';
    
    let path = `M ${getX(0, values.length)} ${getY(values[0])}`;
    
    for (let i = 1; i < values.length; i++) {
      const x1 = getX(i - 1, values.length);
      const y1 = getY(values[i - 1]);
      const x2 = getX(i, values.length);
      const y2 = getY(values[i]);
      
      const cpX = (x1 + x2) / 2;
      path += ` Q ${cpX} ${y1}, ${cpX} ${(y1 + y2) / 2}`;
      path += ` T ${x2} ${y2}`;
    }
    
    return path;
  };

  const linePath = createLinePath(rainAmounts, getY);

  return (
    <div style={{ width: '100%', margin: 'var(--space-sm) 0' }}>
      <div style={{ position: 'relative', width: '100%', height: `${chartHeight}px` }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="rainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--green-primary)" stopOpacity="0.4" />
              <stop offset="50%" stopColor="var(--green-light)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--green-primary)" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#rainGradient)"
            style={{ transition: 'all 0.6s ease' }}
          />
          
          {/* Rainfall curve */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--green-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: 'all 0.6s ease' }}
          />
          
          {/* Data points */}
          {data.map((day, i) => {
            const x = getX(i, data.length);
            const y = getY(day.rainAmount);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={day.rainChance > 50 ? "5" : "3"}
                  fill={day.rainChance > 50 ? "var(--green-light)" : "var(--green-primary)"}
                  stroke="var(--bg-card)"
                  strokeWidth="2"
                  style={{ transition: 'all 0.6s ease', opacity: day.rainAmount > 0 ? 1 : 0.5 }}
                />
                {/* Tooltip */}
                <title>{`${day.date.toLocaleDateString()}: ${day.rainAmount}mm (${day.rainChance}% chance)`}</title>
              </g>
            );
          })}
        </svg>
        
        {/* Rainfall amount labels */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 var(--space-xs)' }}>
          {data.map((day, i) => (
            <div key={i} style={{ textAlign: 'center', flex: 1 }}>
              {day.rainAmount > 0 && (
                <div style={{ fontSize: '10px', color: 'var(--green-light)', fontWeight: 600, marginBottom: '2px' }}>
                  {day.rainAmount}mm
                </div>
              )}
              <div style={{ fontSize: '9px', color: day.rainChance > 50 ? 'var(--green-light)' : 'var(--text-tertiary)' }}>
                {day.rainChance}%
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Day labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', paddingTop: 'var(--space-md)' }}>
        {data.map((day, i) => (
          <div key={i} style={{ textAlign: 'center', flex: 1 }}>
            {i === 0 ? 'Today' : day.date.toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
        ))}
      </div>
    </div>
  );
};

interface InsightItemProps {
  icon: string;
  title: string;
  text: string;
}

const InsightItem: React.FC<InsightItemProps> = ({ icon, title, text }) => (
  <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start' }}>
    <div style={{ fontSize: 'var(--h3)' }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 'var(--body)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: 'var(--body)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{text}</div>
    </div>
  </div>
);

interface CultivationCardProps {
  recommendation: {
    category: string;
    action: string;
    timing: string;
    details: string;
    expectedYield?: string;
    waterEfficiency?: string;
    expectedBenefit?: string;
    riskLevel?: string;
  };
}

const CultivationCard: React.FC<CultivationCardProps> = ({ recommendation }) => {
  const categoryIcons: Record<string, string> = {
    PLANTING: '🌾',
    IRRIGATION: '💧',
    FERTILIZATION: '🌱',
    PEST_MANAGEMENT: '🛡️',
    HARVEST: '🌾',
  };

  return (
    <div style={{
      padding: 'var(--space-md)',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--space-xs)',
      border: '1px solid var(--border-color)',
      borderLeft: '4px solid var(--green-primary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
        <span style={{ fontSize: 'var(--h3)' }}>{categoryIcons[recommendation.category] || '📋'}</span>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{recommendation.category}</div>
          <div style={{ fontSize: 'var(--body)', fontWeight: 600, color: 'var(--text-primary)' }}>{recommendation.action}</div>
        </div>
      </div>
      <div style={{ fontSize: 'var(--body)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', lineHeight: 1.6 }}>
        {recommendation.details}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Timing</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green-light)' }}>{recommendation.timing}</div>
        </div>
        {recommendation.expectedYield && (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Expected Impact</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green-light)' }}>{recommendation.expectedYield}</div>
          </div>
        )}
        {recommendation.waterEfficiency && (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Efficiency</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green-light)' }}>{recommendation.waterEfficiency}</div>
          </div>
        )}
        {recommendation.expectedBenefit && (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Benefit</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green-light)' }}>{recommendation.expectedBenefit}</div>
          </div>
        )}
        {recommendation.riskLevel && (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>Risk Level</div>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: recommendation.riskLevel === 'LOW' ? 'var(--green-light)' : recommendation.riskLevel === 'MODERATE' ? '#f59e0b' : '#ef4444'
            }}>
              {recommendation.riskLevel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface RiskAlertProps {
  alert: {
    type: string;
    severity: string;
    day?: number;
    days?: number;
    impact: string;
    action: string;
    urgency: string;
  };
}

const RiskAlert: React.FC<RiskAlertProps> = ({ alert }) => {
  const severityColors: Record<string, string> = {
    LOW: 'var(--green-light)',
    MODERATE: '#f59e0b',
    HIGH: '#ef4444',
    CRITICAL: '#dc2626',
  };

  const typeIcons: Record<string, string> = {
    HEAT_STRESS: '🌡️',
    DROUGHT_RISK: '💧',
    FLOOD_RISK: '🌊',
    FROST_RISK: '❄️',
    WIND_DAMAGE: '💨',
    PEST_OUTBREAK: '🐛',
  };

  return (
    <div style={{
      padding: 'var(--space-md)',
      background: alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)',
      borderRadius: 'var(--space-xs)',
      border: `2px solid ${severityColors[alert.severity]}`,
      borderLeft: `4px solid ${severityColors[alert.severity]}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
        <span style={{ fontSize: 'var(--h3)' }}>{typeIcons[alert.type] || '⚠️'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px' }}>
            <div style={{ fontSize: 'var(--body)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {alert.type.replace('_', ' ')}
            </div>
            <div style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: `${severityColors[alert.severity]}20`,
              color: severityColors[alert.severity],
              fontWeight: 600,
            }}>
              {alert.severity}
            </div>
            <div style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: alert.urgency === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: alert.urgency === 'HIGH' ? '#ef4444' : 'var(--green-light)',
              fontWeight: 600,
            }}>
              {alert.urgency} URGENCY
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {alert.day ? `Day ${alert.day}` : alert.days ? `Next ${alert.days} days` : 'Immediate'}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 'var(--body)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', lineHeight: 1.6 }}>
        <strong>Impact:</strong> {alert.impact}
      </div>
      <div style={{ fontSize: 'var(--body)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
        <strong>Action Required:</strong> {alert.action}
      </div>
    </div>
  );
};

interface SimpleTipCardProps {
  practice: {
    practice: string;
    tip: string;
    benefit: string;
  };
}

const SimpleTipCard: React.FC<SimpleTipCardProps> = ({ practice }) => (
  <div style={{
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--space-xs)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--space-sm)',
  }}>
    <div style={{ fontSize: 'var(--h3)', marginTop: '2px' }}>💡</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 'var(--body)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
        {practice.practice}
      </div>
      <div style={{ fontSize: 'var(--body)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', lineHeight: 1.5 }}>
        {practice.tip}
      </div>
      <div style={{ fontSize: 'var(--body)', color: 'var(--green-light)', fontWeight: 500 }}>
        Benefit: {practice.benefit}
      </div>
    </div>
  </div>
);


export default Weather;

