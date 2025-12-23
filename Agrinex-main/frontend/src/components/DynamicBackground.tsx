import React, { useEffect, useState } from 'react';
// @ts-ignore
import bgTractor from '../assets/images/bg_tractor.jpg';
// @ts-ignore
import bgIrrigation from '../assets/images/bg_irrigation.jpg';

const DynamicBackground: React.FC = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const images = [bgTractor, bgIrrigation];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dynamic-bg" aria-hidden style={{ background: '#022c22' }}>
      {/* Background Images with fade transition */}
      {images.map((img, index) => (
        <div 
          key={index}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: currentImage === index ? 0.75 : 0, // Higher opacity to see images clearly
            transition: 'opacity 2s ease-in-out',
            zIndex: -1,
            filter: 'grayscale(10%) contrast(105%)' // Less filtering for vibrant colors
          }}
        />
      ))}
      
      {/* Overlay Gradient - reduced intensity so images pop */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(6, 78, 59, 0.4) 0%, rgba(6, 78, 59, 0.6) 100%)',
        zIndex: 0
      }} />

      <div className="bg-gradient" style={{ zIndex: 1, opacity: 0.2 }} />

      <svg className="leaf leaf-1" width="160" height="160" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 2 }}>
        <path d="M2 32C18 10 46 6 62 22" stroke="rgba(16,185,129,0.3)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 40c6-6 18-6 28-2" stroke="rgba(6,95,70,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      <svg className="leaf leaf-2" width="120" height="120" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 2 }}>
        <path d="M4 36C18 14 44 10 60 26" stroke="rgba(16,185,129,0.25)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <svg className="leaf leaf-3" width="200" height="200" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 2 }}>
        <path d="M6 34C20 12 48 8 62 22" stroke="rgba(134,197,108,0.2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export default DynamicBackground;
