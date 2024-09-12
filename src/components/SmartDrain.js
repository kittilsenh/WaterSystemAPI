import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import Wavify from 'react-wavify';
import Graph from './Graph';  // Import the Graph component
import DrainwaterTable from './DrainwaterTable';  // Import real-time data handler
import './SmartDrain.css';

const SmartDrain = () => {
  const [waterLevel, setWaterLevel] = useState(60);  // Default water level
  const [sensor1Data, setSensor1Data] = useState(null);
  const [sensor2Data, setSensor2Data] = useState(null);
  const [sensorData, setSensorData] = useState([]);  // Hold all sensor data
  const [depth, setDepth] = useState(54.56); // Set an initial value for depth

  const [lastUpdated, setLastUpdated] = useState(null);  // Store the last update time



  // Fetch initial data from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://64.227.152.179:8080/drainwater-0.1/drainwater/all');
        const result = await response.json();
        
        setSensorData(result.DrnList);  // Set initial data from API
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);


  // Update sensor 1 and sensor 2 data whenever new sensor data is received
  useEffect(() => {
    if (sensorData.length > 0) {
      const sortedData = [...sensorData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const sensor1 = sortedData[0]; // Latest data
      const sensor2 = sortedData[1] || null; // Second latest data (optional)
  
      setSensor1Data(sensor1);  // Update sensor 1 with the latest data
      setSensor2Data(sensor2);  // Update sensor 2 with the second latest data
  
      const normalizedWaterLevel = normalizeWaterDepth(sensor1?.distance);  // Update water level
      setWaterLevel(normalizedWaterLevel);
    }
  }, [sensorData]);

  // Normalize water depth for display
  const normalizeWaterDepth = (distance) => {
    const maxDistance = 300;
    const normalizedLevel = ((maxDistance - distance) / maxDistance) * 100;
    return Math.max(0, Math.min(normalizedLevel, 100));  
  };

  const calculateVelocity = (distance) => {
    const depthDistance = depth - distance;
    if (depthDistance <= 0) {
      return 0;
    }
    const velocity = (1 / 0.015) *
      Math.pow((0.006 * depthDistance) / (0.02 * depthDistance + 0.6), 2 / 3) *
      Math.sqrt(0.010936);
    return velocity.toFixed(5);
  };

  const calculateFlowRate = (velocity, distance) => {
    const depthDistance = depth - distance;
    if (depthDistance <= 0) {
      return 0;
    }
    const flowRate = velocity * 0.006 * depthDistance;
    return flowRate.toFixed(5);
  };

  const calculateWaterLevelHeight = (distance) => {
    const maxDepth = 450;  // The max depth value
    const waterLevelPercentage = (distance / maxDepth) * 100; // Calculate percentage of max depth
    return Math.min(Math.max(waterLevelPercentage, 0), 100); // Ensure the value is between 0 and 100
  };

  const getWaterColor = (waterLevel) => {
    const lightness = 40 + (waterLevel / 100) * 45; // Ranges from 40% to 85%
    return `hsl(210, 100%, ${lightness}%)`; // HSL for blue, with lightness controlled
  };

  const waterColor = getWaterColor(waterLevel);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  
    // Example function where you fetch new data
    const fetchData = async () => {
      try {
        const response = await fetch('http://64.227.152.179:8080/drainwater-0.1/drainwater/all');
        const result = await response.json();
        setSensorData(result.DrnList);  // Update your data here
        updateLastUpdatedTime();  // Update the "last updated" timestamp
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    // Function to update the last updated timestamp
    const updateLastUpdatedTime = () => {
      const currentTime = new Date().toLocaleTimeString();  // Get current time
      setLastUpdated(currentTime);  // Set it to the lastUpdated state
    };
  
  // Example WebSocket real-time update function
  const handleRealTimeUpdate = (newData) => {
    setSensorData(newData);  // Update your data
    updateLastUpdatedTime();  // Update the "last updated" timestamp
  };

  // Poll the API every 10 seconds
  useEffect(() => {
    // Initial data fetch
    fetchData();

    // Set up polling every 10 seconds
    const interval = setInterval(fetchData, 10000);  // 10 seconds = 10000 milliseconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);
  
  

  return (
    <Container fluid className="smart-drain-system">
      <Row>
        <Col>
          <h1 className="Headline">SMART DRAIN WATER SYSTEM</h1>
        </Col>
      </Row>

      <Card className="parent-card">
        <Row>
          <Col md={{ span: 5, offset: 1 }} className="d-flex justify-content-center">
            <Card.Body className="tank-container">
              <div className="water-tank-container">
                <div className="water-tank">
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
                      height: `${calculateWaterLevelHeight((sensor1Data?.distance) + 50)}%`,
                      position: 'absolute',
                      bottom: 0,
                      width: '100.2%',
                      zIndex: 1,
                    }}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: `${waterLevel / 7.5}%`,
                      left: '7.5px',
                      fontSize: '20px',
                      zIndex: 1,
                    }}
                  >
                    d
                  </div>
                </div>

                {/* Floating divs for visual effect */}
                <div className="floating-div-top">
                  <div className="extra-border-top"></div> {/* Extra border at the top with vertical lines */}
                </div>

                <div className="floating-div-middle">
                  <div className="extra-border-middle"></div>
                </div>

                <div className="floating-div-green">
                  <div className="extra-border-green"></div>
                </div>

                <div className="floating-div">
                  <div className="extra-border"></div>
                </div>
              </div>
            </Card.Body>
          </Col>

          <Col md={6}>
            {/* Sensor 01 */}
            <Card className="sensor-card mb-4">
              <Card.Body>
                <div className="sensor-header">
                  <h5 className="sensor-title">SENSOR 01</h5>
                </div>
                <div className="sensor-info">
                  <div className="sensor-labels">
                    <p><strong>SPEED:</strong> {sensor1Data ? calculateVelocity(sensor1Data.distance) + ' m/s' : 'Loading...'}</p>
                    <p><strong>WATER DEPTH:</strong> {sensor1Data ? sensor1Data.distance + ' m' : 'Loading...'}</p>
                    <p><strong>FLOW RATE:</strong> {sensor1Data ? calculateFlowRate(calculateVelocity(sensor1Data.distance), sensor1Data.distance) + ' m³/s' : 'Not available'}</p>
                  </div>
                </div>
                <p className="battery-label">BATTERY LEVEL: {sensor1Data ? sensor1Data.voltage : 'Loading...'}</p>
                {sensor1Data && (
                  <>
                    <div className="sensor-values">
                      <p><strong>DATE:</strong> {formatTimestamp(sensor1Data.timestamp).date}</p>
                      <p><strong>TIME:</strong> {formatTimestamp(sensor1Data.timestamp).time}</p>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>

            {/* Sensor 02 */}
            <Card className="sensor-card mb-4">
              <Card.Body>
                <div className="sensor-header">
                <h5 className="sensor-title">SENSOR 02</h5>
                </div>
                <div className="sensor-info">
                  <div className="sensor-labels">
                    <p><strong>SPEED:</strong></p>
                    <p><strong>WATER DEPTH:</strong></p>
                    <p><strong>FLOW RATE:</strong></p>
                  </div>
                </div>
                <p className="battery-label">BATTERY LEVEL:</p>
              
                    <div className="sensor-values">
                      <p><strong>DATE:</strong></p>
                      <p><strong>TIME:</strong></p>
                    </div>
                
        
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Graph Section */}
        <Row className="mt-5">
          <Col>
            <Graph sensorData={sensorData} />
          </Col>
        </Row>

        {/* Real-time updates using DrainwaterTable */}
     
        <div className="last-updated">
        <p>Last Updated: {lastUpdated ? lastUpdated : 'Never'}</p>  {/* Display last updated time */}
        <DrainwaterTable onFilterData={handleRealTimeUpdate} />
      </div>
      </Card>
    </Container>
  );
};

export default SmartDrain;