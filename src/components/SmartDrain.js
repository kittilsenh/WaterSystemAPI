import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import Wavify from 'react-wavify';
import Graph from './Graph';  // Import the Graph component
import './SmartDrain.css';

const SmartDrain = () => {
  const [waterLevel, setWaterLevel] = useState(60);  // Default water level
  const [sensor1Data, setSensor1Data] = useState(null);
  const [sensor2Data, setSensor2Data] = useState(null);
  const [sensorData, setSensorData] = useState([]);  // Hold all sensor data
  const [depth, setDepth] = useState(54.56); // Set an initial value for depth


  // Fetch all sensor data from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://64.227.152.179:8080/drainwater-0.1/drainwater/all');
        const result = await response.json();
  
        console.log('Full API response:', result); // Log the entire API response here
        
        setSensorData(result.DrnList);  // Assuming DrnList holds the data
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);
  

  // Sort the data to always get the latest data for Sensor 01 and Sensor 02
  useEffect(() => {
    if (sensorData.length > 0) {
      const sortedData = [...sensorData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const sensor1 = sortedData[0]; // Latest data
      const sensor2 = sortedData[1] || null; // Second latest data (optional)
  
      setSensor1Data(sensor1);
      setSensor2Data(sensor2);
  
      const normalizedWaterLevel = normalizeWaterDepth(sensor1?.distance);
      setWaterLevel(normalizedWaterLevel);
  
      // Log the full sensor data to check the presence of flowRate
      console.log('Sensor 1 Data:', sensor1);
      console.log('Sensor 2 Data:', sensor2);
    }
  }, [sensorData]);

  const normalizeWaterDepth = (distance) => {
    const maxDistance = 300;
    const normalizedLevel = ((maxDistance - distance) / maxDistance) * 100;
    return Math.max(0, Math.min(normalizedLevel, 100));  
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  // Calculate the water color dynamically based on the water level
  const getWaterColor = (waterLevel) => {
  // Define the range of lightness: 40% for low water (dark) and 85% for full (light)
  const lightness = 40 + (waterLevel / 100) * 45; // Ranges from 40% to 85%

  // Return the HSL color string with varying lightness based on water level
  return `hsl(210, 100%, ${lightness}%)`; // HSL for blue, with lightness controlled
};

const waterColor = getWaterColor(waterLevel);

  // Determine the color of "d" based on the water level
  const textColor = waterLevel < 30 ? 'black' : 'white';

  // Function to calculate velocity based on distance and depth
const calculateVelocity = (distance) => {
  const depthDistance = depth - distance; // Assuming 'depth' is a known constant
  if (depthDistance <= 0) {
      return 0; 
  }

  const velocity = (1 / 0.015) *
      Math.pow((0.006 * depthDistance) / (0.02 * depthDistance + 0.6), 2 / 3) *
      Math.sqrt(0.010936);

  return velocity.toFixed(5); // Limiting the decimal places
};

// Function to calculate flow rate based on velocity and depthDistance
const calculateFlowRate = (velocity, distance) => {
  const depthDistance = depth - distance; 
  if (depthDistance <= 0) {
      return 0; 
  }

  const flowRate = velocity * 0.006 * depthDistance;
  return flowRate.toFixed(5); // Limiting the decimal places
};

const maxDepth = 450; // The max depth value

const calculateWaterLevelHeight = (distance) => {
  const waterLevelPercentage = (distance / maxDepth) * 100; // Calculate percentage of max depth
  return Math.min(Math.max(waterLevelPercentage, 0), 100); // Ensure the value is between 0 and 100
};

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
              
            <div className="water-tank-container"> {/* New container for water tank */}
                <div className="water-tank">
                  {/* Bubbles inside the tank */}

                  <Wavify
                    fill={waterColor} // Change the fill color based on water level
                    paused={false}
                    options={{
                      height: 2.5,
                      amplitude: 12.5,
                      speed: 0.20,
                      points: 3,
                    }}
                    style={{ 
                    height: `${calculateWaterLevelHeight((sensor1Data?.distance) + 50)}%`, // Use calculated percentage here
                    position: 'absolute',
                    bottom: 0,
                    width: '100.2%',
                    zIndex: 1 }} // Adjust wave height based on water level Remove 15 on height to be able to remove all the water on decrease
                  />

                  {/* 'd' inside the water */}
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: `${waterLevel / 7.5}%`, // Adjust the position dynamically based on water level
                      left: '7.5px',
                      fontSize: '20px',
                      zIndex: 1,
                    }}
                  >
                    d
                  </div>

                  {/* Vertical measurement with arrows -- 450 -- */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-50px', // Move left to position the arrow and measurement
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      color: 'black',
                    }}
                  >
                    {/* Custom upward arrow */}
                    <div
                      style={{
                        width: '2px',
                        height: '40px', // Length of the arrow line (can be increased or decreased)
                        backgroundColor: 'black',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          content: '',
                          position: 'absolute',
                          top: '-10px', // Position of the arrowhead
                          left: '-5px',
                          borderLeft: '5px solid transparent',
                          borderRight: '5px solid transparent',
                          borderBottom: '10px solid black',
                        }}
                      ></div>
                    </div>

                    <span>450</span>

                    {/* Custom downward arrow */}
                    <div
                      style={{
                        width: '2px',
                        height: '40px', // Length of the arrow line (can be increased or decreased)
                        backgroundColor: 'black',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          content: '',
                          position: 'absolute',
                          bottom: '-10px', // Position of the arrowhead
                          left: '-5px',
                          borderLeft: '5px solid transparent',
                          borderRight: '5px solid transparent',
                          borderTop: '10px solid black',
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Horizontal measurement at the bottom -- 750 --*/}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-55px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'black',
                    }}
                  >
                    {/* Left arrow */}
                    <div
                      style={{
                        width: '90px', // Length of the arrow line
                        height: '2px',
                        backgroundColor: 'black',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          content: '',
                          position: 'absolute',
                          left: '-10px',
                          top: '-5px',
                          borderTop: '5px solid transparent',
                          borderBottom: '5px solid transparent',
                          borderRight: '10px solid black',
                        }}
                      ></div>
                    </div>

                    <span style={{ margin: '0 5px' }}>750</span>

                    {/* Right arrow */}
                    <div
                      style={{
                        width: '90px', // Length of the arrow line
                        height: '2px',
                        backgroundColor: 'black',
                        position: 'relative',
                      }}
                    >
                        <div
                          style={{
                            content: '',
                            position: 'absolute',
                            right: '-10px',
                            top: '-5px',
                            borderTop: '5px solid transparent',
                            borderBottom: '5px solid transparent',
                            borderLeft: '10px solid black',
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Bottom internal width measurement -- 600 --*/}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-22.5px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'black',
                      }}
                    >
                        {/* Left arrow */}
                        <div
                          style={{
                            width: '60px', // Length of the arrow line
                            height: '2px',
                            backgroundColor: 'black',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              content: '',
                              position: 'absolute',
                              left: '-10px',
                              top: '-5px',
                              borderTop: '5px solid transparent',
                              borderBottom: '5px solid transparent',
                              borderRight: '10px solid black',
                            }}
                          ></div>
                        </div>

                        <span style={{ margin: '0 5px' }}>600</span>

                        {/* Right arrow */}
                        <div
                          style={{
                            width: '60px', // Length of the arrow line
                            height: '2px',
                            backgroundColor: 'black',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              content: '',
                              position: 'absolute',
                              right: '-10px',
                              top: '-5px',
                              borderTop: '5px solid transparent',
                              borderBottom: '5px solid transparent',
                              borderLeft: '10px solid black',
                            }}
                          ></div>
                        </div>
                      </div>
                  </div>

                {/* Floating div for visual effect (top) */}
                <div className="floating-div-top">
                  <div className="extra-border-top"></div> {/* Extra border at the top with vertical lines */}
                </div>

                {/* New thinner floating div in the middle of the water tank */}
                <div className="floating-div-middle">
                  <div className="extra-border-middle"></div>
                </div>

                {/* New green floating div for visibility */}
                <div className="floating-div-green">
                  <div className="extra-border-green"></div>
                </div>

                {/* Floating div for visual effect */}
                <div className="floating-div">
                  <div className="extra-border"></div> {/* Example border extension */}
                </div>
              </div> {/* Close water-tank-container */}
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
        <p className="battery-label">BATTERY LEVEL: {sensor1Data ? sensor1Data.voltage : 'Loading...'}</p>
        {sensor1Data && (
          <>
            <div className="sensor-values">
              <p><strong>DATE:</strong> {formatTimestamp(sensor1Data.timestamp).date}</p>
              <p><strong>TIME:</strong> {formatTimestamp(sensor1Data.timestamp).time}</p>
            </div>
          </>
        )}
      </div>
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
          <p><strong>SPEED:</strong> {sensor2Data ? calculateVelocity(sensor2Data.distance) + ' m/s' : 'Loading...'}</p>
          <p><strong>WATER DEPTH:</strong> {sensor2Data ? sensor2Data.distance + ' m' : 'Loading...'}</p>
          <p><strong>FLOW RATE:</strong> {sensor2Data ? calculateFlowRate(calculateVelocity(sensor2Data.distance), sensor2Data.distance) + ' m³/s' : 'Not available'}</p>
        </div>
        <p className="battery-label">BATTERY LEVEL: {sensor2Data ? sensor2Data.voltage : 'Loading...'}</p>
        {sensor2Data && (
          <>
            <div className="sensor-values">
              <p><strong>DATE:</strong> {formatTimestamp(sensor2Data.timestamp).date}</p>
              <p><strong>TIME:</strong> {formatTimestamp(sensor2Data.timestamp).time}</p>
            </div>
          </>
        )}
      </div>
    </Card.Body>
  </Card>
</Col>

        </Row>

        {/* Graph Section */}
        <Row className="mt-5">
          <Col>
            <div className="graph-container">
              {/* Pass all the sensor data to the Graph component */}
              <Graph sensorData={sensorData} />
            </div>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};

export default SmartDrain;
