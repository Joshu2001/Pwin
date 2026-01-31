import { useState, useEffect } from 'react';
import './LaunchScreen.css';

export default function LaunchScreen({ onLoadComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onLoadComplete(), 500);
          return 100;
        }
        return prev + Math.random() * 35;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [onLoadComplete]);

  return (
    <div className="launch-screen">
      <div className="launch-content">
        <div className="launch-container">
          <img
            src="https://i.postimg.cc/vThDvtvK/regaarder-logos-14-removebg-preview-removebg-preview.png"
            alt="Regaarder"
            className="launch-logo"
          />
          
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <p className="progress-text">{Math.floor(Math.min(progress, 100))}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
