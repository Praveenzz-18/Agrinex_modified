import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
// @ts-ignore
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
      <section className="section" style={{ paddingTop: 'var(--space-xl)', position: 'relative', zIndex: 50 }}>
        <div className="container auth-grid" style={{ position: 'relative', zIndex: 51 }}>
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

              // Try to fetch existing data from Firestore first
              let dbFarms: any[] = [];
              let udata: any = null;
              if (db && !isNewUser) {
                try {
                  const userDoc = await getDoc(doc(db, 'users', email));
                  if (userDoc.exists()) {
                    udata = userDoc.data();
                    const qs = query(collection(db, 'farms'), where('owner', '==', email));
                    const fs = await getDocs(qs);
                    dbFarms = fs.docs.map(d => {
                      const data = d.data() as any;
                      return {
                        id: data.id || d.id,
                        name: data.name || 'Farm',
                        location: data.location || '',
                        coordinates: data.coordinates || '',
                        area: Number(data.area ?? 0),
                        cropType: data.cropType,
                        soilType: data.soilType,
                        moisture: typeof data.moisture === 'number' ? data.moisture : undefined,
                      };
                    });
                  }
                } catch (err) {
                  console.error("Firestore lookup error during login:", err);
                }
              }

              // Check for existing user data in localStorage to persist profile updates
              const storedUser = localStorage.getItem('agrinex_user');
              const existingData = storedUser ? JSON.parse(storedUser) : null;
              const hasExistingData = existingData && existingData.email === email;

              let finalFarms: any[] = [];
              let finalName = name;
              let finalPhone = '';
              let finalAddress = '';

              if (isNewUser) {
                finalFarms = [{
                  id: `farm_${Date.now()}`,
                  name: farm || 'My Farm',
                  location: city,
                  coordinates: coords || '0, 0',
                  area: 0,
                }];
              } else if (dbFarms.length > 0) {
                finalFarms = dbFarms;
                if (udata) {
                  finalName = udata.name || name;
                  finalPhone = udata.phone || '';
                  finalAddress = udata.address || '';
                }
              } else if (hasExistingData && existingData.farms && existingData.farms.length > 0) {
                finalFarms = existingData.farms;
                finalName = existingData.name || name;
                finalPhone = existingData.phone || '';
                finalAddress = existingData.address || '';
              } else {
                finalFarms = [{
                  id: 'farm_123',
                  name: farm || 'My Farm',
                  location: 'Vidarbha, Maharashtra',
                  coordinates: '21.1458, 79.0882',
                  area: 5.2,
                }];
              }

              login({
                id: 'user_123',
                name: finalName,
                email: email,
                phone: finalPhone,
                address: finalAddress,
                farms: finalFarms,
              });

              // Navigate immediately to prevent blocking
              navigate(isNewUser ? '/profile' : '/dashboard');
              
              // Fire-and-forget database updates
              try {
                setDoc(doc(db, 'users', email), {
                  id: 'user_123',
                  name: finalName,
                  email,
                  createdAt: udata?.createdAt || new Date().toISOString(),
                }, { merge: true });
                
                for (const f of finalFarms) {
                  setDoc(doc(db, 'farms', `${email}_${f.id}`), {
                    owner: email,
                    ...f,
                  }, { merge: true });
                }
              } catch {}
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
