import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Hero from '../components/Hero';
import FeatureCard from '../components/FeatureCard';
import ImpactStats from '../components/ImpactStats';
import TechPreview from '../components/TechPreview';
import CTA from '../components/CTA';
import agrinexLoop from '../assets/videos/agrinex_loop.mp4';
import DynamicBackground from '../components/DynamicBackground';

const features = [
  {
    title: 'Micro Weather Forecasting',
    body: 'Hyper-local weather predictions for your specific farm location. Get 7-14 day forecasts with temperature, rainfall, humidity, and recommendations on best planting times and crop selection.',
    icon: '🌤️',
  },
  {
    title: 'AI Crop Recommendations',
    body: 'Our system analyzes weather patterns, soil conditions, and market prices to recommend the best crops, cultivation types, and planting schedules for maximum yield and profit.',
    icon: '🌾',
  },
  {
    title: 'Zone-Based Soil Analytics',
    body: 'Your farm is automatically divided into zones. Each zone gets analyzed for soil health, moisture, pH, and nutrients — then we tell you exactly which crop grows best in which zone.',
    icon: '🗺️',
  },
  {
    title: 'Explainable Irrigation AI',
    body: 'Irrigate NOW vs WAIT decisions with confidence, factors, and ROI so farmers trust the recommendation. Weather + soil data combined.',
    icon: '💧',
  },
  {
    title: 'Multi-Farm Network Map',
    body: 'See 10+ connected farms learning together. Share successful strategies, compare performance, and learn from neighbors\' irrigation patterns and crop choices.',
    icon: '🌐',
  },
  {
    title: 'Credit & ROI Proof',
    body: 'Lender-facing risk scoring, ROI uplift, and PDF packs so farmers qualify faster and cheaper. Includes crop yield projections.',
    icon: '💰',
  },
];

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <>
      <DynamicBackground />
      <Hero />
      <div style={{ height: '120px', background: 'linear-gradient(180deg, rgba(16,185,129,0.12), transparent)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
        <div style={{ fontSize: 'var(--h1)' }}>🌾</div>
        <div style={{ fontSize: 'var(--h1)' }}>🌱</div>
        <div style={{ fontSize: 'var(--h1)' }}>🍃</div>
        <div style={{ fontSize: 'var(--h1)' }}>🚜</div>
      </div>

      <section id="overview" className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
            <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'stretch', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 520px', minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                  <div className="pill" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--green-primary)', color: 'var(--green-light)', fontSize: '12px' }}>
                    🌾 Agriculture is Our Core
                  </div>
                </div>
                <h1 style={{ fontSize: 'var(--h1)', marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>Why Agrinex?</h1>
                <p style={{ fontSize: 'var(--body-lg)', lineHeight: 1.618, color: 'var(--text-secondary)', maxWidth: 'var(--narrow-width)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Agrinex is built exclusively for agriculture.</strong> Unlike generic farm management tools, we provide micro weather forecasting for your exact location, AI-powered crop recommendations based on soil and climate, zone-based soil analytics that tell you which crop grows best where, explainable irrigation decisions, salinity predictions, and lender-ready ROI reports — helping you maximize yield, reduce costs, and access credit faster.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                  <a className="btn btn-primary" href="/auth">Start Free Trial</a>
                  <a className="btn btn-secondary" href="#features">Explore Features</a>
                </div>
              </div>

              <div style={{ width: 800, maxWidth: '80%', display: 'flex', alignItems: 'stretch' }}>
                <video
                  src={agrinexLoop}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}
                  aria-label="Agrinex looping product preview"
                />
              </div>
            </div>
            <div className="card-apple">
              <div className="pill" style={{ marginBottom: 'var(--space-md)' }}>Live Snapshot</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
                <Metric title="Active Farms" value="10" delta="+2" />
                <Metric title="Lives Impacted" value="247" delta="+18" />
                <Metric title="Water Saved" value="28%" delta="+3%" />
                <Metric title="Loan Approvals" value="12" delta="+2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="section alt" style={{ paddingTop: 0 }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
            <div className="pill" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--green-primary)', color: 'var(--green-light)' }}>
              🌾 Agriculture-First Features
            </div>
          </div>
          <h2 style={{ fontSize: 'var(--h1)', margin: 'var(--space-sm) 0 var(--space-md)', color: 'var(--text-primary)' }}>Built for agriculture intelligence</h2>
          <p style={{ fontSize: 'var(--body-lg)', color: 'var(--text-secondary)', maxWidth: 'var(--narrow-width)', marginBottom: 'var(--space-lg)' }}>
            Every feature is designed around agriculture workflows — from soil health to crop yield, water management to financial planning. This is purpose-built technology for modern farming.
          </p>
          <div className="features-grid">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      <ImpactStats />
      <TechPreview />
      <CTA />
    </>
  );
};

interface MetricProps {
  title: string;
  value: string;
  delta?: string;
}

const Metric: React.FC<MetricProps> = ({ title, value, delta }) => (
  <div>
    <div style={{ fontSize: 'var(--h2)', fontWeight: 700, lineHeight: 1, color: 'var(--green-primary)' }}>{value}</div>
    <div style={{ fontSize: 'var(--body-lg)', color: 'var(--text-secondary)' }}>{title}</div>
    {delta && (
      <div style={{ fontSize: 'var(--body)', fontWeight: 500, color: 'var(--green-light)' }}>
        {delta.startsWith('-') ? '▼' : '▲'} {delta.replace('-', '')}
      </div>
    )}
  </div>
);

export default Home;

