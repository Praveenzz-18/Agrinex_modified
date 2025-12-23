import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import InteractiveField from './InteractiveField';

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  return (
    <section id="hero" className="hero-full" style={{ background: 'linear-gradient(180deg, rgba(16,185,129,0.12), transparent)', paddingBottom: 'var(--space-xl)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', alignItems: 'center' }}>
          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'calc(var(--space-xs) * -1)' }}>
              <div className="pill" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--green-primary)', color: 'var(--green-light)', fontSize: '12px' }}>
                🌾 Agriculture-First Platform
              </div>
            </div>
            <h1 className="hero-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>🌿</span>
              <span>Agrinex</span>
            </h1>
            <p className="hero-sub">
              <strong style={{ color: 'var(--text-primary)' }}>Built specifically for agriculture.</strong> The only platform with micro weather forecasting, AI crop recommendations, zone-based soil analytics, smart irrigation AI, and lender-ready credit proof — so you make better decisions, save ...
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <a
                className="btn btn-primary"
                href={isAuthenticated ? '/dashboard' : '/auth'}
                onClick={(e) => { e.preventDefault(); navigate(isAuthenticated ? '/dashboard' : '/auth'); }}
              >
                Start Free Trial
              </a>
              <a
                className="btn btn-secondary"
                href={isAuthenticated ? '/dashboard' : '/auth'}
                onClick={(e) => { e.preventDefault(); navigate(isAuthenticated ? '/dashboard' : '/auth'); }}
              >
                See How It Works
              </a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
              <HeroStat value="87%" label="Decision Accuracy" />
              <HeroStat value="28%" label="Water Savings" />
              <HeroStat value="45%" label="Profit Increase" />
              <HeroStat value="14 days" label="Forecast Horizon" />
            </div>
          </div>
          <div className="hero-visual">
                <InteractiveField />
          </div>
        </div>
      </div>
    </section>
  );
};

const HeroStat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div>
    <div style={{ fontSize: 'var(--h2)', fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)' }}>{value}</div>
    <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)', marginTop: '4px' }}>{label}</div>
  </div>
);

const ChartVisual: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
      <span style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{ fontSize: 'var(--body)', fontWeight: 600, color: 'var(--text-primary)' }}>{value}%</span>
    </div>
    <div style={{ 
      height: '8px', 
      background: 'var(--bg-tertiary)', 
      borderRadius: '4px', 
      overflow: 'hidden'
    }}>
      <div style={{ 
        height: '100%', 
        width: `${value}%`, 
        background: color, 
        transition: 'width 0.6s ease',
        borderRadius: '4px',
        boxShadow: `0 0 8px ${color}40`
      }} />
    </div>
  </div>
);

const MiniMetric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ padding: 'var(--space-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--space-xs)', border: '1px solid var(--border-color)' }}>
    <div style={{ fontSize: 'var(--body)', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{label}</div>
  </div>
);

const WeatherForecast: React.FC = () => (
  <div style={{ padding: 'var(--space-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--space-xs)', border: '1px solid var(--border-color)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
      <span style={{ fontSize: 'var(--body)', fontWeight: 600, color: 'var(--text-primary)' }}>7-Day Forecast</span>
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Micro Weather</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', fontSize: '11px' }}>
      <WeatherDay day="Today" temp="32°C" rain="0%" />
      <WeatherDay day="+1d" temp="31°C" rain="20%" />
      <WeatherDay day="+2d" temp="29°C" rain="60%" />
      <WeatherDay day="+3d" temp="28°C" rain="40%" />
    </div>
    <div style={{ marginTop: 'var(--space-xs)', paddingTop: 'var(--space-xs)', borderTop: '1px solid var(--border-color)' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>💡 Best planting: Day +2 (rain expected)</span>
    </div>
  </div>
);

const WeatherDay: React.FC<{ day: string; temp: string; rain: string }> = ({ day, temp, rain }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{day}</div>
    <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px', color: 'var(--text-primary)' }}>{temp}</div>
    <div style={{ fontSize: '10px', color: rain !== '0%' ? 'var(--green-light)' : 'var(--text-tertiary)' }}>{rain}</div>
  </div>
);

const ZoneRecommendation: React.FC = () => (
  <div style={{ padding: 'var(--space-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--space-xs)', border: '1px solid var(--border-color)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
      <span style={{ fontSize: 'var(--body)', fontWeight: 600, color: 'var(--text-primary)' }}>Zone Recommendations</span>
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Soil-Based</span>
    </div>
    <div style={{ display: 'grid', gap: '6px', fontSize: '11px' }}>
      <ZoneRow zone="Zone 1" crop="Wheat" suitability="Excellent (95%)" color="#10b981" />
      <ZoneRow zone="Zone 2" crop="Cotton" suitability="Good (78%)" color="#34d399" />
      <ZoneRow zone="Zone 3" crop="Rice" suitability="Moderate (65%)" color="#f59e0b" />
    </div>
  </div>
);

const ZoneRow: React.FC<{ zone: string; crop: string; suitability: string; color: string }> = ({ zone, crop, suitability, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{zone}:</span>
    <span style={{ color, fontWeight: 600 }}>{crop}</span>
    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{suitability}</span>
  </div>
);

export default Hero;

