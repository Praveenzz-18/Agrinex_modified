import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  title: string;
  body: string;
  icon: string;
}

const FeatureCard: React.FC<Props> = ({ title, body, icon }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  return (
    <div className="card-apple feature-card">
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <div className="pill">{icon}</div>
        <h3 style={{ 
          fontSize: 'var(--h3)', 
          fontWeight: 600,
          margin: 'var(--space-md) 0 var(--space-sm) 0',
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          color: 'var(--text-primary)'
        }}>
          {title}
        </h3>
      </div>
      <p style={{ 
        color: 'var(--text-secondary)', 
        fontSize: 'var(--body)', 
        lineHeight: 1.618,
        margin: '0 0 var(--space-lg) 0',
        flex: 1
      }}>
        {body}
      </p>
      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-color)' }}>
        <a
          className="btn btn-secondary"
          href={isAuthenticated ? '/dashboard' : '/auth'}
          onClick={(e) => { e.preventDefault(); navigate(isAuthenticated ? '/dashboard' : '/auth'); }}
          style={{ width: '100%', textAlign: 'center', justifyContent: 'center', marginTop: 'var(--space-sm)' }}
        >
          Learn more
        </a>
      </div>
    </div>
  );
};

export default FeatureCard;

