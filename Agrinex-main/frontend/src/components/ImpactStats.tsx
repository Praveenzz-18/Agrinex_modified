import React from 'react';

const stats = [
  { label: 'Water Savings', value: '-22%' },
  { label: 'Yield Uplift', value: '+12%' },
  { label: 'Downtime Reduced', value: '-31%' },
  { label: 'Network Uptime', value: '99.97%' },
];

const ImpactStats: React.FC = () => {
  return (
    <section id="impact" className="section">
      <div className="container">
        <div style={{ textAlign: 'left', marginBottom: 'var(--space-lg)' }}>
          <div className="pill" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--green-primary)', color: 'var(--green-light)' }}>
            🌾 Agriculture Impact Metrics
          </div>
        </div>
        <div className="impact">
          {stats.map((item) => (
            <div key={item.label}>
              <div className="label">{item.label}</div>
              <div className="value" style={{ color: 'var(--green-primary)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactStats;

