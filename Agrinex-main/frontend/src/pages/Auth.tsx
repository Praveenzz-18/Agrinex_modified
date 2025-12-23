import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
// @ts-ignore
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import DynamicBackground from '../components/DynamicBackground';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.hash === '#signup') {
      setMode('signup');
    }
  }, []);

  return (
    <>
      <DynamicBackground />
      <section className="section" style={{ paddingTop: 'var(--space-xl)' }}>
        <div className="container auth-grid">
        <div className="auth-hero card-apple">
          <div className="pill" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--green-primary)', color: 'var(--green-light)' }}>
            🌾 Welcome to Agrinex
          </div>
          <h1 style={{ fontSize: 'var(--h1)', margin: 'var(--space-sm) 0', color: 'var(--text-primary)' }}>Agriculture Intelligence Platform</h1>
          <p style={{ fontSize: 'var(--body-lg)', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '520px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Built exclusively for agriculture.</strong> Join Agrinex to access AI-powered irrigation recommendations, salinity prediction, soil analytics, micro weather forecasting, and lender-ready credit proof — all designed for modern farming.
          </p>
          <div style={{ display: 'grid', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
            <div className="auth-bullet">🌾 Agriculture-first technology built for farming workflows</div>
            <div className="auth-bullet">🌐 Multi-farm intelligence with real-time collaboration</div>
            <div className="auth-bullet">💧 Irrigation decisions with explainability</div>
            <div className="auth-bullet">🧂 Salinity prediction & soil health scoring</div>
            <div className="auth-bullet">💰 Credit readiness & ROI proof for lenders</div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-toggle">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Log In
            </button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
          </div>

          <form 
            className="auth-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const email = formData.get('email') as string;
              const name = formData.get('name') as string || email.split('@')[0];
              const farm = formData.get('farm') as string || 'My Farm';
              const city = formData.get('city') as string || 'My City';
              const password = formData.get('password') as string;
              
              // Simulate login - replace with actual backend API call
              // For new users, redirect to profile setup; for existing users, go to dashboard
              const isNewUser = mode === 'signup';

              let coords = '';
              let lat = 0;
              let lon = 0;
              if (isNewUser && 'geolocation' in navigator) {
                try {
                  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 });
                  });
                  lat = Number(position.coords.latitude.toFixed(4));
                  lon = Number(position.coords.longitude.toFixed(4));
                  coords = `${lat}, ${lon}`;
                } catch {
                  coords = '';
                }
              }

              if (isNewUser) {
                try {
                  await api.post('/api/v1/auth/profile', {
                    full_name: name,
                    email,
                    phone: '',
                    village: city,
                    district: city,
                    state: city,
                  });
                } catch {}
              }

              const farms = isNewUser ? [{
                id: `farm_${Date.now()}`,
                name: farm || 'My Farm',
                location: city,
                coordinates: coords || '0, 0',
                area: 0,
              }] : [{
                id: 'farm_123',
                name: farm || 'My Farm',
                location: 'Punjab, India',
                coordinates: '30.7333, 76.7794',
                area: 5.2,
              }];

              

              login({
                id: 'user_123',
                name: name,
                email: email,
                phone: '',
                address: '',
                farms,
              });
              
              try {
                await setDoc(doc(db, 'users', email), {
                  id: 'user_123',
                  name,
                  email,
                  farms,
                  createdAt: new Date().toISOString(),
                }, { merge: true });
                const fid = farms[0]?.id || `farm_${Date.now()}`;
                await setDoc(doc(db, 'farms', `${email}_${fid}`), {
                  owner: email,
                  ...farms[0],
                }, { merge: true });
              } catch {}
              
              // Redirect new users to profile setup, existing users to dashboard
              navigate(isNewUser ? '/profile' : '/dashboard');
            }}
          >
            {mode === 'signup' && (
              <div className="form-row">
                <label htmlFor="name">Full Name</label>
                <input id="name" name="name" type="text" placeholder="Rajesh Kumar" required />
              </div>
            )}

            <div className="form-row">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>

            <div className="form-row">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" placeholder="••••••••" required />
            </div>

            {mode === 'signup' && (
              <>
              <div className="form-row">
                <label htmlFor="farm">Primary Farm</label>
                <input id="farm" name="farm" type="text" placeholder="Farm 1 - Rajesh Kumar" />
              </div>
              <div className="form-row">
                <label htmlFor="city">City</label>
                <input id="city" name="city" type="text" placeholder="Your City" required />
              </div>
              </>
            )}

            <div className="form-row inline">
              <label className="checkbox">
                <input type="checkbox" defaultChecked />
                <span>I agree to the Terms and Privacy Policy</span>
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              {mode === 'login' ? 'Log In' : 'Create Account'}
            </button>

            <div className="auth-alt">
              {mode === 'login' ? (
                <span>
                  New here?{' '}
                  <button type="button" className="link-like" onClick={() => setMode('signup')}>
                    Create an account
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button type="button" className="link-like" onClick={() => setMode('login')}>
                    Log in
                  </button>
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
    </>
  );
};

export default Auth;
