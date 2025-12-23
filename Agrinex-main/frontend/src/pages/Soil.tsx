import React, { useMemo, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

const Soil: React.FC = () => {
  const { user, getSelectedFarm } = useAuth();
  const selectedFarm = getSelectedFarm() || (user?.farms?.[0] ?? null);
  const [mlCropRecs, setMlCropRecs] = useState<Array<{ crop: string; suitability: number; reason: string }>>([]);
  const [mlIrrigation, setMlIrrigation] = useState<any | null>(null);
  const [gemini, setGemini] = useState<any | null>(null);

  // Mock soil data (replace with backend API)
  const soilData = useMemo(() => ({
    summary: {
      healthScore: 78,
      salinity: 2.1, // dS/m
      moisture: 38, // %
      organicMatter: 2.0, // %
      bulkDensity: 1.35, // g/cm3
      cec: 18, // meq/100g
    },
    nutrients: {
      nitrogen: 185, // kg/ha
      phosphorus: 28,
      potassium: 165,
      ph: 6.9,
      ec: 2.1,
    },
    layers: [
      { name: 'Topsoil (0-15 cm)', depth: 15, texture: 'Loamy', moisture: 42, color: '#6b4e3d' },
      { name: 'Root Zone (15-45 cm)', depth: 30, texture: 'Sandy Loam', moisture: 35, color: '#7c5a45' },
      { name: 'Subsoil (45-90 cm)', depth: 45, texture: 'Clay Loam', moisture: 30, color: '#8a654d' },
    ],
    recommendations: [
      {
        title: 'Improve Organic Matter',
        detail: 'Add 3-4 tons/acre compost before next sowing to raise OM from 2.0% to 2.5%',
        impact: '+8% water retention, +6% yield stability',
        priority: 'HIGH',
      },
      {
        title: 'Salinity Management',
        detail: 'Light leaching irrigation (25 mm) + gypsum 400 kg/acre to lower EC from 2.1→1.8 dS/m',
        impact: 'Reduce salt stress, protect seedlings',
        priority: 'MEDIUM',
      },
      {
        title: 'Balanced Nutrition',
        detail: 'Apply 90:40:40 NPK split (40% basal, 30% tillering, 30% panicle)',
        impact: '+10% nutrient use efficiency',
        priority: 'MEDIUM',
      },
    ],
    geminiInsights: [
      'Soil texture mix supports cereals and pulses; avoid salt-sensitive vegetables until EC <1.8',
      'Morning irrigations recommended to minimize evap losses on current moisture profile',
      'Cover cropping (legumes) post-harvest to boost nitrogen and organic matter',
    ],
    cropMatches: [
      { crop: 'Wheat', suitability: 88, reason: 'Optimal pH, adequate moisture, moderate EC tolerance' },
      { crop: 'Barley', suitability: 85, reason: 'Handles current EC, suits loamy profile' },
      { crop: 'Chickpea', suitability: 82, reason: 'Prefers near-neutral pH, benefits from current OM' },
    ],
  }), []);

  useEffect(() => {
    const run = async () => {
      try {
        const q = selectedFarm?.location || 'Bengaluru, Karnataka';
        const geoRes = await api.get('/api/geocode', { params: { q } });
        const loc = (geoRes.data?.results && geoRes.data.results[0]) || null;
        const stateName = loc?.region || (q.split(',')[1]?.trim() ?? 'Karnataka');
        const districtName = loc?.name || (q.split(',')[0]?.trim() ?? 'Bengaluru');
        const soilType = selectedFarm?.soilType || 'Loam';
        const moisturePct = soilData.summary.moisture;
        const soilQuality = moisturePct < 35 ? 'Poor' : moisturePct > 65 ? 'Rich' : 'Medium';
        const soilFeel = moisturePct < 35 ? 'dry and crumbly' : moisturePct > 65 ? 'wet and muddy' : 'slightly damp';
        const applicationRate = 5.0;
        const cropRes = await api.post('/api/v1/crop/recommend', {
          soil_type: soilType,
          soil_quality: soilQuality,
          state_name: stateName,
          district_name: districtName,
        });
        const irrigRes = await api.post('/api/v1/irrigation/recommend', {
          soil_feel: soilFeel,
          application_rate: applicationRate,
          state_name: stateName,
          district_name: districtName,
        });
        setMlCropRecs(cropRes.data?.recommendations || []);
        setMlIrrigation(irrigRes.data || null);
        let lat: number | null = null;
        let lon: number | null = null;
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
        const gRes = await api.post('/api/weather/gemini-insights', { lat: lat ?? 12.9716, lon: lon ?? 77.5946, days: 7 });
        setGemini(gRes.data || null);
      } catch {}
    };
    run();
  }, [selectedFarm?.id]);

  return (
    <section className="section" style={{ paddingTop: 'var(--space-xl)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="pill" style={{ marginBottom: 'var(--space-sm)' }}>🌱 Soil Intelligence</div>
          <h1 style={{ fontSize: 'var(--h1)', marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>
            Soil Health & Visual Analysis
          </h1>
          <p style={{ fontSize: 'var(--body-lg)', color: 'var(--text-secondary)', maxWidth: 'var(--narrow-width)', lineHeight: 1.6 }}>
            Visualize your soil profile, key metrics, and AI-backed recommendations. We blend soil analytics with market-aware crop matching to help you decide what to grow next.
          </p>
        </div>

        {/* Farm context */}
        {selectedFarm && (
          <div className="card-apple" style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
              <div>
                <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-xs)' }}>
                  Analyzing Farm
                </div>
                <div style={{ fontSize: 'var(--h2)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedFarm.name}
                </div>
                <div style={{ fontSize: 'var(--body)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {selectedFarm.location} · {selectedFarm.area || 0} acres
                </div>
              </div>
              <div style={{
                padding: 'var(--space-sm) var(--space-md)',
                borderRadius: 'var(--space-xs)',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid var(--green-primary)',
                color: 'var(--green-light)',
                fontSize: 'var(--body)',
                fontWeight: 600,
              }}>
                Soil Score: {soilData.summary.healthScore}/100
              </div>
            </div>
          </div>
        )}

        {/* Key metrics */}
        <div className="card-apple" style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
            {[
              { label: 'Soil Health', value: `${soilData.summary.healthScore}/100` },
              { label: 'Salinity (EC)', value: `${soilData.summary.salinity} dS/m` },
              { label: 'Moisture', value: `${soilData.summary.moisture}%` },
              { label: 'Organic Matter', value: `${soilData.summary.organicMatter}%` },
              { label: 'Bulk Density', value: `${soilData.summary.bulkDensity} g/cm³` },
              { label: 'CEC', value: `${soilData.summary.cec} meq/100g` },
            ].map((m, i) => (
              <div key={i} style={{ padding: 'var(--space-md)', borderRadius: 'var(--space-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{m.label}</div>
                <div style={{ fontSize: 'var(--h3)', fontWeight: 700, color: 'var(--text-primary)' }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Soil profile visualization */}
        <div className="card-apple" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: 'var(--h2)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
            Soil Profile Visualization
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr', gap: 'var(--space-xl)', alignItems: 'stretch', minHeight: '320px' }}>
            <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
              <div style={{ position: 'relative', borderRadius: 'var(--space-xs)', border: '1px solid var(--border-color)', overflow: 'hidden', background: 'var(--bg-tertiary)', minHeight: '260px' }}>
                {soilData.layers.map((layer, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      height: `${(layer.depth / 90) * 100}%`,
                      background: layer.color,
                      borderBottom: idx !== soilData.layers.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 var(--space-sm)',
                      color: 'white',
                      fontSize: '12px',
                      animation: `pulseLayer 6s ease-in-out ${idx * 0.4}s infinite`,
                    }}
                  >
                    {layer.name} · {layer.texture} · {layer.moisture}% moisture
                    <div style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.14)',
                      color: 'white',
                      fontSize: '11px',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}>
                      {layer.texture}
                    </div>
                  </div>
                ))}
                {/* Moisture gradient overlay */}
                <div style={{
                  position: 'absolute',
                  right: '0',
                  top: 0,
                  bottom: 0,
                  width: '12px',
                  background: 'linear-gradient(180deg, rgba(125, 211, 252, 0.8), rgba(16, 185, 129, 0.8))',
                  opacity: 0.5,
                  animation: 'sheen 3s ease-in-out infinite',
                }} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '12px', height: '12px', background: '#6b4e3d', borderRadius: '2px' }} /> Loamy
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '12px', height: '12px', background: '#7c5a45', borderRadius: '2px' }} /> Sandy Loam
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '12px', height: '12px', background: '#8a654d', borderRadius: '2px' }} /> Clay Loam
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  Moisture ribbon shows relative moisture (top → bottom)
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-md)', alignContent: 'start' }}>
              <MetricCard label="pH" value={soilData.nutrients.ph.toFixed(1)} />
              <MetricCard label="EC" value={`${soilData.nutrients.ec} dS/m`} />
              <MetricCard label="Nitrogen" value={`${soilData.nutrients.nitrogen} kg/ha`} />
              <MetricCard label="Phosphorus" value={`${soilData.nutrients.phosphorus} kg/ha`} />
              <MetricCard label="Potassium" value={`${soilData.nutrients.potassium} kg/ha`} />
              <MetricCard label="Moisture" value={`${soilData.summary.moisture}%`} />
            </div>
          </div>
        </div>
        <style>{`
          @keyframes sheen {
            0% { opacity: 0.25; transform: translateY(-10%); }
            50% { opacity: 0.6; transform: translateY(0%); }
            100% { opacity: 0.25; transform: translateY(10%); }
          }
          @keyframes pulseLayer {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.05); }
          }
        `}</style>

        {/* Crop matching & insights */}
        <div className="card-apple" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: 'var(--h2)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
            Crop Matching
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
            {(mlCropRecs.length > 0 ? mlCropRecs : soilData.cropMatches).map((c: any, i: number) => (
              <div key={i} style={{ padding: 'var(--space-md)', border: '1px solid var(--border-color)', borderRadius: 'var(--space-xs)', background: 'var(--bg-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                  <div style={{ fontSize: 'var(--body)', fontWeight: 700, color: 'var(--text-primary)' }}>{c.crop}</div>
                  <div style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(16,185,129,0.12)', color: 'var(--green-light)', fontSize: '11px', fontWeight: 700 }}>
                    {c.suitability}% fit
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {c.reason}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>
              Insights (based on soil data)
            </div>
            <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
              {(gemini?.insights || soilData.geminiInsights).map((insight: string, i: number) => (
                <div key={i} style={{
                  padding: 'var(--space-sm)',
                  borderRadius: 'var(--space-xs)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-tertiary)',
                  fontSize: 'var(--body)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}>
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended actions */}
        <div className="card-apple" style={{ padding: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: 'var(--h2)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
            Recommended Actions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
            {soilData.recommendations.map((rec, i) => (
              <div key={i} style={{
                padding: 'var(--space-md)',
                borderRadius: 'var(--space-xs)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
                display: 'grid',
                gap: 'var(--space-xs)',
              }}>
                <div style={{ fontSize: 'var(--body)', fontWeight: 700, color: 'var(--text-primary)' }}>{rec.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rec.detail}</div>
                <div style={{ fontSize: '12px', color: 'var(--green-light)', fontWeight: 600 }}>{rec.impact}</div>
                <div style={{
                  fontSize: '11px',
                  color: rec.priority === 'HIGH' ? '#ef4444' : rec.priority === 'MEDIUM' ? '#f59e0b' : 'var(--text-primary)',
                  fontWeight: 700,
                }}>
                  Priority: {rec.priority}
                </div>
              </div>
            ))}
            {mlIrrigation && (
              <div style={{
                padding: 'var(--space-md)',
                borderRadius: 'var(--space-xs)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)',
                display: 'grid',
                gap: 'var(--space-xs)',
              }}>
                <div style={{ fontSize: 'var(--body)', fontWeight: 700, color: 'var(--text-primary)' }}>{mlIrrigation.irrigate ? 'Irrigate Now' : 'Wait'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{mlIrrigation.reason_weather}</div>
                <div style={{ fontSize: '12px', color: 'var(--green-light)', fontWeight: 600 }}>Water: {mlIrrigation.water_mm} mm</div>
                <div style={{ fontSize: '12px', color: 'var(--green-light)', fontWeight: 600 }}>Duration: {mlIrrigation.duration_hours} h</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const MetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--space-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: 'var(--h3)', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
  </div>
);

export default Soil;

