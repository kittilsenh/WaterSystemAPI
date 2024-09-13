// components/WaterTank.js
import React from 'react';
import Wavify from 'react-wavify';
import './WaterTank.css';

const WaterTank = () => {
  // For the login page, we can simply use a static water level, e.g., 60%
  const waterLevel = 60; 

  const getWaterColor = (waterLevel) => {
    const lightness = 40 + (waterLevel / 100) * 45;
    return `hsl(210, 100%, ${lightness}%)`; // HSL color for blue water
  };

  const calculateWaterLevelHeight = (distance) => {
    const maxDepth = 450;  // Static max depth
    return Math.min(Math.max((distance / maxDepth) * 100, 0), 100); // Fixed water level percentage
  };

  const waterColor = getWaterColor(waterLevel);

  return (
    <div className="water-tank-container">
      <div className="water-tank">
        {/* Water level visualization */}
        <Wavify
          fill={waterColor}
          paused={false}
          options={{
            height: 2.5,
            amplitude: 12.5,
            speed: 0.20,
            points: 3,
          }}
          style={{
            height: `${calculateWaterLevelHeight(250)}%`, // Set a height (static for visual)
            position: 'absolute',
            bottom: 0,
            width: '100.2%',
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
};

export default WaterTank;
