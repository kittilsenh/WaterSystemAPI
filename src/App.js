import React, { useState } from 'react';
import SmartDrain from './components/SmartDrain';
import DrainwaterTable from './components/DrainwaterTable';
import Login from './components/Login';

function App() {
  const [sensorData, setSensorData] = useState([]);  // Hold sensor data
  const [isLoggedIn, setIsLoggedIn] = useState(false);  // Track login status

  // Function to receive data from DrainwaterTable
  const handleFilterData = (data) => {
    setSensorData(data);  // Directly update sensor data
  };

  // Function to handle successful login
  const handleLogin = () => {
    setIsLoggedIn(true);  // Set user as logged in
  };

  return (
    <div className="App">
      {/* Conditionally render login page or SmartDrain system */}
      {isLoggedIn ? (
        <>
          <DrainwaterTable onFilterData={handleFilterData} />
          <SmartDrain sensorData={sensorData} />
        </>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;