import React, { useState } from 'react';
import SmartDrain from './components/SmartDrain';
import DrainwaterTable from './components/DrainwaterTable';

function App() {
  const [sensorData, setSensorData] = useState([]);  // Hold sensor data

  // Function to receive data from DrainwaterTable
  const handleFilterData = (data) => {
    setSensorData(data);  // Directly update sensor data
  };

  return (
    <div className="App">
      <DrainwaterTable onFilterData={handleFilterData} />
      <SmartDrain sensorData={sensorData} />
    </div>
  );
}

export default App;
