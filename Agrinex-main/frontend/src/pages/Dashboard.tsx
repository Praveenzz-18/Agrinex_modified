import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const Dashboard: React.FC = () => {
  const { user, getSelectedFarm } = useAuth();
  const [weatherSummary, setWeatherSummary] = useState<any | null>(null);
  useEffect(() => {
    const load = async () => {
      if (!db || !user) return;
      const farm = getSelectedFarm() || user.farms?.[0];
      if (!farm) return;
      try {
        const wdoc = await getDoc(doc(db, 'weather', `${user.id}_${farm.id}`));
        if (wdoc.exists()) setWeatherSummary(wdoc.data());
      } catch {}
    };
    load();
  }, [user?.id, getSelectedFarm]);

  return (
    <section className="section" style={{ paddingTop: 'var(--space-xl)', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(1200px 600px at 10% 0%, rgba(16,185,129,0.10), transparent), radial-gradient(800px 400px at 90% 0%, rgba(34,197,94,0.08), transparent)',
        pointerEvents: 'none',
      }} />
      <div className="container">
        <div style={{ marginBottom: 'var(--space-xl)', position: 'relative' }}>
          <div style={{ padding: 'var(--space-lg)', borderRadius: 'var(--space-xs)', background: 'linear-gradient(180deg, rgba(34,197,94,0.14), rgba(16,185,129,0.06))', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
              <div className="pill" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--green-primary)', color: 'var(--green-light)' }}>
                🌿 Farmer Dashboard
              </div>
            </div>
            <h1 style={{ fontSize: 'var(--h1)', marginBottom: 'var(--space-md)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>🚜</span>
              <span>Welcome back, {user?.name?.split(' ')[0] || 'Farmer'}!</span>
            </h1>
            <p style={{ fontSize: 'var(--body-lg)', color: 'var(--text-secondary)', maxWidth: 'var(--narrow-width)' }}>
              Your agriculture intelligence dashboard. Monitor your farm, weather, soil health, and financial insights all in one place.
            </p>
            <div style={{
              position: 'absolute',
              right: '-40px',
              top: '-40px',
              width: '220px',
              height: '220px',
              background: 'conic-gradient(from 180deg at 50% 50%, rgba(16,185,129,0.18), rgba(34,197,94,0.12), rgba(16,185,129,0.18))',
              filter: 'blur(24px)',
              borderRadius: '50%',
              animation: 'pulseGradient 8s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute',
              left: '-20px',
              bottom: '-20px',
              width: '140px',
              height: '140px',
              background: 'radial-gradient(closest-side, rgba(16,185,129,0.16), transparent)',
              borderRadius: '50%',
              animation: 'float 10s ease-in-out infinite',
            }} />
          </div>
        </div>
        {!user?.name && (
          <div className="card-apple" style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 'var(--body)', color: 'var(--text-secondary)' }}>
                Your name isn’t set. Update your profile to personalize the dashboard.
              </div>
              <a className="btn btn-secondary" href="/profile">Set Name</a>
            </div>
          </div>
        )}
        {weatherSummary && (
          <div className="card-apple" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="pill" style={{ marginBottom: 'var(--space-sm)' }}>Recent Weather</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)' }}>
              <div>
                <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)' }}>Location</div>
                <div style={{ fontSize: 'var(--h3)', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {weatherSummary.location}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)' }}>Temperature</div>
                <div style={{ fontSize: 'var(--h3)', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {weatherSummary.current?.temperature ?? '-'}°C
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)' }}>Condition</div>
                <div style={{ fontSize: 'var(--h3)', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {weatherSummary.current?.condition ?? '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)' }}>Updated</div>
                <div style={{ fontSize: 'var(--h3)', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {new Date(weatherSummary.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
          <a href="/weather" style={{ textDecoration: 'none' }}>
            <div className="card-apple" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: 'var(--h2)', marginBottom: 'var(--space-sm)' }}>🌤️</div>
              <h3 style={{ fontSize: 'var(--h3)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
                Weather Forecast
              </h3>
              <p style={{ fontSize: 'var(--body)', color: 'var(--text-secondary)' }}>
                View micro weather forecasts and irrigation recommendations
              </p>
            </div>
          </a>

          <a href="/network" style={{ textDecoration: 'none' }}>
            <div className="card-apple" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: 'var(--h2)', marginBottom: 'var(--space-sm)' }}>🌐</div>
              <h3 style={{ fontSize: 'var(--h3)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
                Farm Network
              </h3>
              <p style={{ fontSize: 'var(--body)', color: 'var(--text-secondary)' }}>
                Connect with other farms and share insights
              </p>
            </div>
          </a>

          <a href="/soil" style={{ textDecoration: 'none' }}>
            <div className="card-apple" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: 'var(--h2)', marginBottom: 'var(--space-sm)' }}>🌱</div>
              <h3 style={{ fontSize: 'var(--h3)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
                Soil Health
              </h3>
              <p style={{ fontSize: 'var(--body)', color: 'var(--text-secondary)' }}>
                Monitor soil health and salinity predictions
              </p>
            </div>
          </a>

          <a href="/financial" style={{ textDecoration: 'none' }}>
            <div className="card-apple" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: 'var(--h2)', marginBottom: 'var(--space-sm)' }}>💰</div>
              <h3 style={{ fontSize: 'var(--h3)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
                Financial
              </h3>
              <p style={{ fontSize: 'var(--body)', color: 'var(--text-secondary)' }}>
                Track ROI, loans, and financial insights
              </p>
            </div>
          </a>
        </div>
        <style>{`
          @keyframes pulseGradient {
            0% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.08); opacity: 0.7; }
            100% { transform: scale(1); opacity: 0.9; }
          }
          @keyframes float {
            0% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-8px) translateX(4px); }
            100% { transform: translateY(0px) translateX(0px); }
          }
        `}</style>
      </div>
    </section>
  );
};

export default Dashboard;
