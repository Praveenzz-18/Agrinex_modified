import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="title">Agrinex</div>
            <div className="small" style={{ marginTop: 'var(--space-xs)' }}>© {new Date().getFullYear()} Agrinex · Agriculture-first intelligence.</div>
            <div className="small" style={{ marginTop: '4px', color: 'var(--text-tertiary)' }}>Built exclusively for modern farming.</div>
            <div style={{ marginTop: 'var(--space-sm)', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Built with 💚 by <strong style={{ color: 'var(--text-primary)' }}>Praveen B M</strong>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
                <a
                  href="https://github.com/Praveenzz-18"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--green-light)',
                    fontSize: '12px',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/praveen-b-m-8a2705299/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--green-light)',
                    fontSize: '12px',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
          <div>
            <div className="title">Product</div>
            <a href="#overview">Overview</a>
            <br />
            <a href="#features">Features</a>
          </div>
          <div>
            <div className="title">Platform</div>
            <Link to="/soil">Soil Intelligence</Link>
            <br />
            <Link to="/weather">Weather Forecast</Link>
          </div>
          <div>
            <div className="title">Support</div>
            <a href="mailto:mkr612005@gmail.com">mkr612005@gmail.com</a>
            <br />
            <a href="#cta">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

