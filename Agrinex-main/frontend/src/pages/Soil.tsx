import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

const Soil: React.FC = () => {
  const { user, getSelectedFarm } = useAuth();
  const selectedFarm = getSelectedFarm() || (user?.farms?.[0] ?? null);

  // --- State Variables ---
  const [soilType, setSoilType] = useState<string>('Loam');
  const [soilQuality, setSoilQuality] = useState<string>('Medium');
  const [soilFeel, setSoilFeel] = useState<string>('slightly damp');
  const [stateName, setStateName] = useState<string>('Karnataka');
  const [districtName, setDistrictName] = useState<string>('Bengaluru');
  const [latitude, setLatitude] = useState<number>(12.9716);
  const [longitude, setLongitude] = useState<number>(77.5946);

  // Detailed manual soil override
  const [isCustomSoil, setIsCustomSoil] = useState<boolean>(false);
  const [nValue, setNValue] = useState<number>(50);
  const [pValue, setPValue] = useState<number>(25);
  const [kValue, setKValue] = useState<number>(25);
  const [phValue, setPhValue] = useState<number>(7.0);
  const [moisturePct, setMoisturePct] = useState<number>(45);

  const [applicationRate, setApplicationRate] = useState<number>(5.0);

  // Predictions & Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mlCropRecs, setMlCropRecs] = useState<any[]>([]);
  const [mlIrrigation, setMlIrrigation] = useState<any | null>(null);
  const [weather, setWeather] = useState<any | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>('');
  const [locationSource, setLocationSource] = useState<'Default' | 'GPS' | 'Manual' | 'Farm'>('Default');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // --- ML Studio States ---
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'studio'>('diagnostics');
  const [trainingModelType, setTrainingModelType] = useState<string>('Random Forest');
  const [trainingEstimators, setTrainingEstimators] = useState<number>(100);
  const [trainingMaxDepth, setTrainingMaxDepth] = useState<number | ''>('');
  const [trainingMinSplit, setTrainingMinSplit] = useState<number>(2);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingSuccessMessage, setTrainingSuccessMessage] = useState<string>('');
  const [modelMetrics, setModelMetrics] = useState<any>(null);

  // Load metrics on mount
  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/api/v1/ml/metrics');
      if (res.data?.success) {
        setModelMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error('Failed to load ML metrics:', err);
    }
  };

  const handleTrainModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTraining(true);
    setErrorMessage('');
    setTrainingSuccessMessage('');
    try {
      const res = await api.post('/api/v1/ml/train', {
        model_type: trainingModelType,
        n_estimators: trainingEstimators,
        max_depth: trainingMaxDepth === '' ? null : Number(trainingMaxDepth),
        min_samples_split: trainingMinSplit
      });
      if (res.data?.success) {
        setTrainingSuccessMessage(res.data.message);
        setModelMetrics(res.data.metrics);
      } else {
        setErrorMessage('Failed to train the model.');
      }
    } catch (err: any) {
      let msg = err.response?.data?.detail || err.message || 'Error occurred during training.';
      if (err.message?.toLowerCase().includes('network error') || err.code === 'ERR_NETWORK') {
        msg = 'Unable to connect to the backend server. Please verify that the FastAPI backend is running! Open a terminal in the backend directory and run: "cd backend && venv39\\Scripts\\activate && python -m uvicorn app.main:app --port 8000 --reload" to activate the virtual environment and serve the application.';
      }
      setErrorMessage(msg);
    } finally {
      setIsTraining(false);
    }
  };

  // Major Indian States list
  const indianStates = [
    'Karnataka', 'Maharashtra', 'Chhattisgarh', 'Tamil Nadu', 'Telangana',
    'Andhra Pradesh', 'Uttar Pradesh', 'West Bengal', 'Gujarat', 'Rajasthan',
    'Madhya Pradesh', 'Bihar', 'Haryana', 'Punjab', 'Odisha', 'Kerala', 'Goa'
  ];

  // --- Default Mappings ---
  const SOIL_QUALITY_MAP: Record<string, { N: number; P: number; K: number }> = {
    'Poor': { N: 20, P: 10, K: 10 },
    'Medium': { N: 50, P: 25, K: 25 },
    'Rich': { N: 90, P: 40, K: 40 },
  };

  const SOIL_TYPE_MAP: Record<string, number> = {
    'Sandy': 6.5,
    'Loam': 7.0,
    'Clay': 7.5,
    'Red': 6.0,
    'Black': 8.0,
    'Laterite': 5.5,
    'Alluvial': 7.2,
    'Mixed': 6.8,
  };

  const SOIL_FEEL_MAP: Record<string, number> = {
    'dry and crumbly': 20,
    'slightly damp': 45,
    'wet and muddy': 80,
  };

  // Sync smart defaults based on selected preset unless custom mode is unlocked
  useEffect(() => {
    if (!isCustomSoil) {
      const npk = SOIL_QUALITY_MAP[soilQuality] || SOIL_QUALITY_MAP['Medium'];
      setNValue(npk.N);
      setPValue(npk.P);
      setKValue(npk.K);
    }
  }, [soilQuality, isCustomSoil]);

  useEffect(() => {
    if (!isCustomSoil) {
      const ph = SOIL_TYPE_MAP[soilType] || 7.0;
      setPhValue(ph);
    }
  }, [soilType, isCustomSoil]);

  useEffect(() => {
    if (!isCustomSoil) {
      const moist = SOIL_FEEL_MAP[soilFeel] || 45;
      setMoisturePct(moist);
    }
  }, [soilFeel, isCustomSoil]);

  // Load farm details if selected
  useEffect(() => {
    if (selectedFarm) {
      if (selectedFarm.soilType) setSoilType(selectedFarm.soilType);
      if (selectedFarm.location) {
        const parts = selectedFarm.location.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          setDistrictName(parts[0]);
          // Check if state is in our list
          const matchedState = indianStates.find(s => s.toLowerCase() === parts[1].toLowerCase());
          if (matchedState) setStateName(matchedState);
        } else {
          setDistrictName(selectedFarm.location);
        }
      }
      if (selectedFarm.coordinates) {
        const cleaned = selectedFarm.coordinates.replace(/[^\d\.,\-]/g, '');
        const coords = cleaned.split(',').map(Number);
        if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          setLatitude(coords[0]);
          setLongitude(coords[1]);
        }
      }
      setLocationSource('Farm');
    }
  }, [selectedFarm]);

  // Run first diagnosis on mount or farm switch
  useEffect(() => {
    runDiagnosis();
  }, [selectedFarm?.id]);

  // --- Handlers ---
  const handleGPSLocation = () => {
    setGpsStatus('Requesting GPS lock...');
    setErrorMessage('');
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(Number(lat.toFixed(4)));
        setLongitude(Number(lon.toFixed(4)));
        setGpsStatus('GPS locked! Resolving address...');
        setLocationSource('GPS');

        try {
          // Pass lat,lon directly to geocode endpoint
          const res = await api.get('/api/geocode', { params: { q: `${lat},${lon}` } });
          const results = res.data?.results;
          if (results && results.length > 0) {
            const loc = results[0];
            if (loc.name) setDistrictName(loc.name);
            if (loc.region) {
              const matchedState = indianStates.find(s => s.toLowerCase() === loc.region.toLowerCase());
              if (matchedState) setStateName(matchedState);
            }
            setGpsStatus('GPS lock and reverse-geocode active.');
          } else {
            setGpsStatus('GPS lock active (Address details unavailable).');
          }
        } catch {
          setGpsStatus('GPS lock active (Geocoding server error).');
        }
      },
      (error) => {
        setGpsStatus(`GPS failed: ${error.message}`);
        setLocationSource('Manual');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const runDiagnosis = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const payload: any = {
        soil_type: soilType,
        soil_quality: soilQuality,
        state_name: stateName,
        district_name: districtName,
        latitude,
        longitude
      };

      if (isCustomSoil) {
        payload.n_value = nValue;
        payload.p_value = pValue;
        payload.k_value = kValue;
        payload.ph_value = phValue;
      }

      // Crop recommendation
      const cropRes = await api.post('/api/v1/crop/recommend', payload);
      
      // Irrigation recommendation
      const irrigPayload = {
        soil_feel: soilFeel,
        application_rate: applicationRate,
        state_name: stateName,
        district_name: districtName,
        latitude,
        longitude
      };
      const irrigRes = await api.post('/api/v1/irrigation/recommend', irrigPayload);

      if (cropRes.data?.success) {
        setMlCropRecs(cropRes.data.recommended_crops || []);
        if (cropRes.data.weather) {
          setWeather(cropRes.data.weather);
        }
      } else {
        setErrorMessage(cropRes.data?.error || 'Crop prediction endpoint returned error status.');
      }

      if (irrigRes.data?.success) {
        setMlIrrigation(irrigRes.data);
      }
    } catch (e: any) {
      let msg = e.response?.data?.detail || e.message || 'Failed to reach backend prediction services.';
      if (e.message?.toLowerCase().includes('network error') || e.code === 'ERR_NETWORK') {
        msg = 'Unable to connect to the backend server. Please verify that the FastAPI backend is running! Open a terminal in the backend directory and run: "cd backend && venv39\\Scripts\\activate && python -m uvicorn app.main:app --port 8000 --reload" to activate the virtual environment and serve the application.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic explanation generator for the crop matches based on current soil parameters
  const getExplanation = (crop: string, prob: number) => {
    const pPercent = Math.round(prob * 100);
    if (pPercent > 80) {
      return `Outstanding fit under current ${soilType.toLowerCase()} profile and ${phValue.toFixed(1)} pH level. The NPK levels match this cereal/vegetable's requirements.`;
    } else if (pPercent > 50) {
      return `Good secondary option. Requires moderate fertilization adjustment to reach absolute yield potential. Highly compatible with local weather.`;
    } else {
      return `Feasible crop with minor soil modification. Requires careful moisture tracking and custom nitrogen splits.`;
    }
  };

  return (
    <section className="section" style={{ paddingTop: 'var(--space-xl)', color: 'var(--text-primary)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="pill" style={{ marginBottom: 'var(--space-sm)' }}>🌱 Machine Learning</div>
          <h1 style={{ fontSize: 'var(--h1)', marginBottom: 'var(--space-md)', color: 'var(--text-primary)', textShadow: '0 0 40px rgba(16,185,129,0.1)' }}>
            Soil Intelligence Control Center
          </h1>
          <p style={{ fontSize: 'var(--body-lg)', color: 'var(--text-secondary)', maxWidth: 'var(--narrow-width)', lineHeight: 1.6 }}>
            Acquire precision coordinate-based predictions. Input exact GPS locks or customize chemical parameters manually to run deep scikit-learn models for custom crop matching and scheduling.
          </p>
        </div>

        {errorMessage && (
          <div style={{
            padding: 'var(--space-md)',
            borderRadius: 'var(--space-xs)',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid #ef4444',
            color: '#f87171',
            marginBottom: 'var(--space-lg)',
            fontSize: 'var(--body)',
          }}>
            <strong>Error:</strong> {errorMessage}
          </div>
        )}

        {/* Core Layout Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-xl)', alignItems: 'start' }}>
          
          {/* ================================== LEFT COLUMN: INPUT CONTROLS ================================== */}
          <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
            
            {/* 1. Farm Location & GPS Selection */}
            <div className="card-apple" style={{ background: 'rgba(2, 44, 34, 0.45)', border: '1px solid rgba(16,185,129,0.15)', backdropFilter: 'blur(16px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'var(--space-sm)' }}>
                <h3 style={{ fontSize: 'var(--h3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📍</span> Farm Profile & GPS Coordinates
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--green-light)', fontWeight: 600 }}>
                  Source: {locationSource}
                </span>
              </div>

              {/* Geolocation Button */}
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleGPSLocation}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
                    background: 'var(--green-primary)',
                    fontWeight: 600,
                  }}
                >
                  <span>📡</span> Click to Use Live GPS Coordinates
                </button>
                {gpsStatus && (
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px', textAlign: 'center', fontStyle: 'italic' }}>
                    {gpsStatus}
                  </div>
                )}
              </div>

              {/* Location inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Indian State
                  </label>
                  <select
                    value={stateName}
                    onChange={(e) => { setStateName(e.target.value); setLocationSource('Manual'); }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {indianStates.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    District / Town
                  </label>
                  <input
                    type="text"
                    value={districtName}
                    onChange={(e) => { setDistrictName(e.target.value); setLocationSource('Manual'); }}
                    style={{
                      width: '100%',
                      padding: '9px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="e.g. Bengaluru"
                  />
                </div>
              </div>

              {/* Coordinates Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={(e) => { setLatitude(Number(e.target.value)); setLocationSource('Manual'); }}
                    style={{
                      width: '100%',
                      padding: '9px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={(e) => { setLongitude(Number(e.target.value)); setLocationSource('Manual'); }}
                    style={{
                      width: '100%',
                      padding: '9px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Soil Properties Preset Controls */}
            <div className="card-apple" style={{ background: 'rgba(2, 44, 34, 0.45)', border: '1px solid rgba(16,185,129,0.15)', backdropFilter: 'blur(16px)' }}>
              <h3 style={{ fontSize: 'var(--h3)', fontWeight: 600, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'var(--space-sm)' }}>
                <span>🧬</span> Soil Properties & Composition
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Soil Classification
                  </label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {Object.keys(SOIL_TYPE_MAP).map((type) => (
                      <option key={type} value={type}>{type} Soil</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    General Quality
                  </label>
                  <select
                    value={soilQuality}
                    onChange={(e) => setSoilQuality(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="Poor">Poor Fertility</option>
                    <option value="Medium">Medium Fertility</option>
                    <option value="Rich">Rich Organic Fertility</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Soil Feel (Moisture preset)
                  </label>
                  <select
                    value={soilFeel}
                    onChange={(e) => setSoilFeel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="dry and crumbly">Dry and Crumbly (Low)</option>
                    <option value="slightly damp">Slightly Damp (Medium)</option>
                    <option value="wet and muddy">Wet and Muddy (High)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    Irrigation Rate (mm/h)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={applicationRate}
                    onChange={(e) => setApplicationRate(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              {/* Custom Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'var(--space-sm)' }}>
                <input
                  type="checkbox"
                  id="customOverride"
                  checked={isCustomSoil}
                  onChange={(e) => setIsCustomSoil(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--green-primary)', cursor: 'pointer' }}
                />
                <label htmlFor="customOverride" style={{ fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--green-light)' }}>
                  Unlock Custom Chemical Sliders (NPK + pH + Moisture)
                </label>
              </div>
            </div>

            {/* 3. Detailed Manual overrides (Sliders) */}
            {isCustomSoil && (
              <div className="card-apple" style={{ background: 'rgba(2, 44, 34, 0.45)', border: '1px solid rgba(16,185,129,0.15)', backdropFilter: 'blur(16px)', animation: 'fadeIn 0.3s ease' }}>
                <h3 style={{ fontSize: 'var(--h3)', fontWeight: 600, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'var(--space-sm)' }}>
                  <span>🔬</span> Laboratory Chemical Parameters
                </h3>

                {/* N Slider */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Nitrogen (N_req)</span>
                    <strong style={{ color: '#60a5fa' }}>{nValue} kg/ha</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    value={nValue}
                    onChange={(e) => setNValue(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#60a5fa', cursor: 'pointer' }}
                  />
                </div>

                {/* P Slider */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Phosphorus (P_req)</span>
                    <strong style={{ color: '#f43f5e' }}>{pValue} kg/ha</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={pValue}
                    onChange={(e) => setPValue(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#f43f5e', cursor: 'pointer' }}
                  />
                </div>

                {/* K Slider */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Potassium (K_req)</span>
                    <strong style={{ color: '#fbbf24' }}>{kValue} kg/ha</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="150"
                    value={kValue}
                    onChange={(e) => setKValue(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
                  />
                </div>

                {/* pH Slider */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Soil pH Level</span>
                    <strong style={{ color: '#34d399' }}>{phValue.toFixed(1)}</strong>
                  </div>
                  <input
                    type="range"
                    min="3.0"
                    max="11.0"
                    step="0.1"
                    value={phValue}
                    onChange={(e) => setPhValue(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#34d399', cursor: 'pointer' }}
                  />
                </div>

                {/* Moisture Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Soil Moisture Ratio</span>
                    <strong style={{ color: '#38bdf8' }}>{moisturePct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={moisturePct}
                    onChange={(e) => setMoisturePct(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                  />
                </div>
              </div>
            )}

            {/* Run Button */}
            <button
              type="button"
              className="btn btn-primary"
              disabled={isLoading}
              onClick={runDiagnosis}
              style={{
                padding: 'var(--space-md)',
                fontSize: '16px',
                borderRadius: '8px',
                background: isLoading ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--green-primary), #10b981)',
                color: 'white',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                boxShadow: isLoading ? 'none' : '0 4px 20px rgba(16, 185, 129, 0.4)',
              }}
            >
              {isLoading ? (
                <>
                  <span className="spinner" /> Running scikit-learn Inferences...
                </>
              ) : (
                <>
                  <span>🌾</span> Run AI Diagnostics & Predictions
                </>
              )}
            </button>

          </div>

          {/* ================================== RIGHT COLUMN: DYNAMIC DIAGNOSIS & RESULTS ================================== */}
          <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>

            {/* 1. Dynamic Soil layer visualizer */}
            <div className="card-apple" style={{ background: 'rgba(2, 44, 34, 0.45)', border: '1px solid rgba(16,185,129,0.15)', backdropFilter: 'blur(16px)' }}>
              <h3 style={{ fontSize: 'var(--h3)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                Live Layer Composition Visualizer
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', alignItems: 'stretch' }}>
                
                {/* SVG Layer representation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{
                    position: 'relative',
                    height: '240px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    background: '#18181b',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Layer 1: Topsoil */}
                    <div style={{
                      height: `${100 - moisturePct * 0.6}%`,
                      background: soilType === 'Black' ? '#1c1917' : soilType === 'Red' ? '#7f1d1d' : '#451a03',
                      transition: 'all 0.6s ease-in-out',
                      padding: 'var(--space-xs)',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '10px',
                      fontWeight: 600,
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}>
                      <span>Topsoil (0-15 cm)</span>
                      <span>Composition: {soilType}</span>
                    </div>

                    {/* Layer 2: Root Zone */}
                    <div style={{
                      flexGrow: 1,
                      background: soilType === 'Black' ? '#292524' : soilType === 'Red' ? '#991b1b' : '#78350f',
                      transition: 'all 0.6s ease-in-out',
                      padding: 'var(--space-xs)',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '10px',
                      fontWeight: 600,
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                      Root Zone · Moisture: {moisturePct}%
                    </div>

                    {/* Layer 3: Subsoil (Wetness glow based on moisturePct) */}
                    <div style={{
                      height: `${moisturePct * 0.4}%`,
                      background: 'linear-gradient(180deg, #1e3a8a, #172554)',
                      transition: 'all 0.6s ease-in-out',
                      padding: 'var(--space-xs)',
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '10px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'flex-end',
                      boxShadow: `inset 0 10px 20px rgba(56, 189, 248, ${moisturePct / 100})`,
                    }}>
                      Subsoil Water Table
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', fontStyle: 'italic' }}>
                    Visual heights animate in real-time to reflect chemical soil moisture percentages.
                  </div>
                </div>

                {/* Right of visualization - Metric boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', alignContent: 'start' }}>
                  <div style={{ padding: 'var(--space-sm)', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Soil pH Rating</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: phValue < 6.0 ? '#fbbf24' : phValue > 8.0 ? '#38bdf8' : '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span>{phValue.toFixed(1)}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>
                        ({phValue < 6.0 ? 'Acidic' : phValue > 8.0 ? 'Alkaline' : 'Near Neutral'})
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: 'var(--space-sm)', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Nitrogen (N) profile</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {nValue} kg/ha
                    </div>
                  </div>

                  <div style={{ padding: 'var(--space-sm)', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Phosphorus (P) profile</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {pValue} kg/ha
                    </div>
                  </div>

                  <div style={{ padding: 'var(--space-sm)', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Potassium (K) profile</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {kValue} kg/ha
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. ML predicted crops */}
            <div className="card-apple" style={{ background: 'rgba(2, 44, 34, 0.45)', border: '1px solid rgba(16,185,129,0.15)', backdropFilter: 'blur(16px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <h3 style={{ fontSize: 'var(--h3)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  🌾 AI Crop Matches (scikit-learn Model)
                </h3>
                {weather && (
                  <span style={{ fontSize: '12px', color: 'var(--green-light)', fontWeight: 600 }}>
                    Weather: {weather.temperature}°C · {weather.humidity}% Rh
                  </span>
                )}
              </div>

              {mlCropRecs.length > 0 ? (
                <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                  {mlCropRecs.map((c, i) => {
                    const prob = c.probability ?? (c.suitability ? c.suitability / 100 : 0.80);
                    const fitPercent = Math.round(prob * 100);
                    return (
                      <div
                        key={i}
                        style={{
                          padding: 'var(--space-md)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: i === 0 ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-tertiary)',
                          boxShadow: i === 0 ? 'inset 0 0 12px rgba(16, 185, 129, 0.1)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: 'var(--body)', fontWeight: 700, color: i === 0 ? 'var(--green-light)' : 'var(--text-primary)' }}>
                            {i === 0 ? '🥇 ' : ''}{c.crop}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green-light)' }}>
                            {fitPercent}% Suitability Fit
                          </span>
                        </div>

                        {/* Suitability bar */}
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginBottom: 'var(--space-xs)' }}>
                          <div style={{
                            height: '100%',
                            width: `${fitPercent}%`,
                            background: i === 0 ? 'linear-gradient(90deg, var(--green-primary), #34d399)' : 'var(--green-primary)',
                            borderRadius: '999px',
                            transition: 'width 1s cubic-bezier(0.1, 0.8, 0.2, 1)',
                          }} />
                        </div>

                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {getExplanation(c.crop, prob)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: 'var(--space-lg)', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--body)' }}>
                  No diagnosis run yet. Complete coordinates on the left and run analysis.
                </div>
              )}
            </div>

            {/* 3. ML predicted Irrigation Scheduling */}
            {mlIrrigation && mlIrrigation.success && (
              <div className="card-apple" style={{
                background: mlIrrigation.irrigate ? 'rgba(14, 116, 144, 0.2)' : 'rgba(2, 44, 34, 0.45)',
                border: mlIrrigation.irrigate ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(16,185,129,0.15)',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.5s ease',
              }}>
                <h3 style={{ fontSize: 'var(--h3)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💧</span> Irrigation Scheduling AI
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 'var(--space-sm) 0' }}>
                  <div style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: mlIrrigation.irrigate ? '#0891b2' : 'rgba(16, 185, 129, 0.2)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    boxShadow: mlIrrigation.irrigate ? '0 0 15px rgba(6, 182, 212, 0.4)' : 'none',
                  }}>
                    Decision: {mlIrrigation.irrigate ? 'Irrigate Now' : 'Wait'}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Model Certainty: {Math.round(mlIrrigation.model_probability * 100)}%
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', margin: 'var(--space-md) 0 var(--space-sm)' }}>
                  <div style={{ padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.15)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Water Depth Needed</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                      {mlIrrigation.water_mm} mm
                    </div>
                  </div>
                  <div style={{ padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.15)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Calculated Duration</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                      {mlIrrigation.duration_hours} hours
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: 'var(--space-sm)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(0,0,0,0.2)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5
                }}>
                  <strong>Reasoning:</strong> {mlIrrigation.reason_weather} (Moisture index calculated at {mlIrrigation.moisture_level.toFixed(2)} under {mlIrrigation.application_rate_mm_per_h} mm/h application rate).
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Embedded Spinner Styles */}
      <style>{`
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </section>
  );
};

export default Soil;
