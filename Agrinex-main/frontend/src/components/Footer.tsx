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
            <a href="mailto:support@agrinex.ai">support@agrinex.ai</a>
            <br />
            <a href="#cta">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

