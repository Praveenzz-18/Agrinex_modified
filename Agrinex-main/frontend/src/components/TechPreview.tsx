import React from 'react';

const TechPreview: React.FC = () => {
  return (
    <section id="analytics" className="section alt">
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
          <div className="pill" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--green-primary)', color: 'var(--green-light)' }}>
            🌾 Agriculture-First Technology
          </div>
        </div>
        <h2 style={{ fontSize: 'var(--h1)', margin: 'var(--space-sm) 0 var(--space-md)', color: 'var(--text-primary)' }}>
          Built for farmers, powered by agriculture intelligence
        </h2>
        <p style={{ fontSize: 'var(--body-lg)', color: 'var(--text-secondary)', maxWidth: 'var(--narrow-width)', marginBottom: 'var(--space-xl)' }}>
          Every feature is designed with agriculture in mind — from soil health to crop yield optimization, water management to credit access. This isn't generic farm software; it's purpose-built for modern agriculture.
        </p>
        
        <div>
          <AnalyticsCard
            title="Micro Weather Forecasting"
            metric="7-14 days"
            label="Forecast Range"
            details={[
              { label: 'Hyper-local', value: 'Farm-specific predictions' },
              { label: 'Temperature', value: 'Daily min/max forecasts' },
              { label: 'Rainfall', value: 'Probability + mm predictions' },
              { label: 'Best Planting', value: 'AI-recommended dates' },
            ]}
            advantage="Get weather predictions for your exact farm location, not generic regional forecasts"
          />
          <AnalyticsCard
            title="AI Crop Recommendations"
            metric="95%"
            label="Suitability Match"
            details={[
              { label: 'Weather Analysis', value: '7-14 day patterns' },
              { label: 'Soil Conditions', value: 'pH, nutrients, moisture' },
              { label: 'Market Prices', value: 'Current + projected rates' },
              { label: 'Cultivation Type', value: 'Best methods suggested' },
            ]}
            advantage="We analyze weather, soil, and market data to recommend the best crop + cultivation method"
          />
          <AnalyticsCard
            title="Zone-Based Crop Matching"
            metric="5 zones"
            label="Per Farm Analysis"
            details={[
              { label: 'Soil Analytics', value: 'Per-zone health scores' },
              { label: 'Crop Matching', value: 'Best crop per zone' },
              { label: 'Suitability %', value: 'Precision scoring' },
              { label: 'Yield Projection', value: 'Expected output' },
            ]}
            advantage="Your farm is split into zones. We analyze each zone's soil and tell you which crop grows best where"
          />
          <AnalyticsCard
            title="Explainable Irrigation AI"
            metric="87%"
            label="Decision Confidence"
            details={[
              { label: 'Weather Integration', value: '7-day forecast' },
              { label: 'Soil Sensors', value: 'Real-time data' },
              { label: 'Network Learning', value: '10 farms sharing' },
              { label: 'Transparency', value: 'See why it works' },
            ]}
            advantage="Unlike black-box systems, we show exactly why we recommend NOW vs WAIT"
          />
          <AnalyticsCard
            title="14-Day Salinity Forecast"
            metric="83%"
            label="Prediction Accuracy"
            details={[
              { label: 'LSTM Deep Learning', value: 'Trained on 3 years data' },
              { label: 'Early Warning', value: 'Crisis alerts 12 days ahead' },
              { label: 'Auto Recommendations', value: 'Leaching schedules' },
              { label: 'Confidence Intervals', value: 'Risk boundaries shown' },
            ]}
            advantage="Predict salinity crises before they happen — no other platform offers this"
          />
          <AnalyticsCard
            title="Lender-Ready Credit Proof"
            metric="A-"
            label="Average Rating"
            details={[
              { label: 'Default Risk', value: '9.3% (73% lower than avg)' },
              { label: 'ROI Projection', value: '937% over 3 years' },
              { label: 'PDF Reports', value: 'Auto-generated' },
              { label: 'Loan Approvals', value: '12 farms qualified' },
            ]}
            advantage="Get approved for loans 2x faster with AI-generated risk assessments banks trust"
          />
        </div>

        <div className="card-apple">
          <div className="pill" style={{ marginBottom: 'var(--space-md)' }}>Real Impact, Measured Results</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-lg)', marginTop: 'var(--space-md)' }}>
            <ImpactMetric value="28%" label="Water Savings" desc="vs traditional methods" />
            <ImpactMetric value="45%" label="Profit Increase" desc="average per farm" />
            <ImpactMetric value="14 days" label="Early Warning" desc="salinity crisis alerts" />
            <ImpactMetric value="₹8,200" label="Monthly Savings" desc="per farm average" />
          </div>
        </div>
      </div>
    </section>
  );
};

interface AnalyticsCardProps {
  title: string;
  metric: string;
  label: string;
  details: Array<{ label: string; value: string }>;
  advantage: string;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, metric, label, details, advantage }) => (
  <div className="card-apple analytics-card">
    <div style={{ marginBottom: 'var(--space-md)' }}>
      <h3 style={{ fontSize: 'var(--h3)', fontWeight: 600, margin: '0 0 var(--space-xs) 0', color: 'var(--text-primary)' }}>{title}</h3>
      <div style={{ fontSize: 'var(--h2)', fontWeight: 700, lineHeight: 1, marginBottom: '4px', color: 'var(--green-primary)' }}>{metric}</div>
      <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)' }}>{label}</div>
    </div>
    <div style={{ display: 'grid', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
      {details.map((detail, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--body)', paddingTop: 'var(--space-xs)', borderTop: i > 0 ? '1px solid var(--border-color)' : 'none' }}>
          <span style={{ color: 'var(--text-tertiary)' }}>{detail.label}:</span>
          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{detail.value}</span>
        </div>
      ))}
    </div>
    <div style={{ 
      padding: 'var(--space-sm)', 
      background: 'rgba(16, 185, 129, 0.15)', 
      borderRadius: 'var(--space-xs)',
      borderLeft: '3px solid var(--green-primary)',
      fontSize: 'var(--body)',
      color: 'var(--text-secondary)',
      fontStyle: 'italic'
    }}>
      <strong style={{ color: 'var(--green-light)' }}>🌾 Agriculture Focus:</strong> {advantage}
    </div>
  </div>
);

interface ImpactMetricProps {
  value: string;
  label: string;
  desc?: string;
}

const ImpactMetric: React.FC<ImpactMetricProps> = ({ value, label, desc }) => (
  <div>
    <div style={{ fontSize: 'var(--h2)', fontWeight: 700, lineHeight: 1, color: 'var(--green-primary)' }}>{value}</div>
    <div style={{ fontSize: 'var(--body-lg)', fontWeight: 500, marginTop: '4px', color: 'var(--text-primary)' }}>{label}</div>
    {desc && (
      <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)', marginTop: '2px' }}>{desc}</div>
    )}
  </div>
);

export default TechPreview;

