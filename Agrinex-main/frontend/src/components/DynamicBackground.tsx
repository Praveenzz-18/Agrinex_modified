import React from 'react';

const DynamicBackground: React.FC = () => {
  return (
    <div className="dynamic-bg" aria-hidden>
      <div className="bg-gradient" />

      <svg className="leaf leaf-1" width="160" height="160" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 32C18 10 46 6 62 22" stroke="rgba(16,185,129,0.85)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 40c6-6 18-6 28-2" stroke="rgba(6,95,70,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      <svg className="leaf leaf-2" width="120" height="120" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 36C18 14 44 10 60 26" stroke="rgba(16,185,129,0.75)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <svg className="leaf leaf-3" width="200" height="200" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 34C20 12 48 8 62 22" stroke="rgba(134,197,108,0.65)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export default DynamicBackground;
