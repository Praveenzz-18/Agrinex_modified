import React from 'react';
// @ts-ignore
import fieldImage from '../assets/images/field_large.jpg';

const InteractiveField: React.FC = () => {
  return (
    <div className="card-apple" style={{ 
      position: 'relative', 
      overflow: 'hidden', 
      padding: 0, 
      minHeight: '550px',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
      
      {/* Background Image */}
      <img 
        src={fieldImage} 
        alt="Field Analysis" 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          filter: 'brightness(0.9) contrast(1.1)'
        }} 
      />

      {/* Grid Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px), linear-gradient(0deg, rgba(16,185,129,0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none'
      }} />

      {/* Scanning Line */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: '2px',
        background: '#10b981',
        boxShadow: '0 0 15px #10b981, 0 0 30px #10b981',
        animation: 'scan 4s ease-in-out infinite',
        zIndex: 10
      }}>
        <div style={{
          position: 'absolute',
          right: '20px',
          top: '-30px',
          background: 'rgba(0,0,0,0.8)',
          color: '#10b981',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 600,
          border: '1px solid #10b981'
        }}>
          Analyzing Soil Health...
        </div>
      </div>

      {/* Interactive Points */}
      <div style={{ position: 'absolute', top: '30%', left: '40%', zIndex: 5 }}>
        <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }} />
        <div style={{ position: 'absolute', inset: -8, border: '1px solid #10b981', borderRadius: '50%', animation: 'pulse-ring 2s infinite' }} />
        <div style={{ 
          position: 'absolute', 
          left: '20px', 
          top: '-10px', 
          background: 'rgba(0,0,0,0.8)', 
          padding: '8px', 
          borderRadius: '8px',
          border: '1px solid rgba(16,185,129,0.3)',
          width: '140px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ fontSize: '10px', color: '#aaa' }}>MOISTURE</div>
          <div style={{ color: '#fff', fontWeight: 600 }}>Optimal (62%)</div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '60%', right: '35%', zIndex: 5 }}>
        <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '50%', boxShadow: '0 0 10px #f59e0b' }} />
        <div style={{ position: 'absolute', inset: -8, border: '1px solid #f59e0b', borderRadius: '50%', animation: 'pulse-ring 2s infinite 1s' }} />
        <div style={{ 
          position: 'absolute', 
          right: '20px', 
          top: '-10px', 
          background: 'rgba(0,0,0,0.8)', 
          padding: '8px', 
          borderRadius: '8px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          width: '140px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ fontSize: '10px', color: '#aaa' }}>N-P-K LEVELS</div>
          <div style={{ color: '#fff', fontWeight: 600 }}>Nitrogen Low</div>
        </div>
      </div>

    </div>
  );
};

export default InteractiveField;
