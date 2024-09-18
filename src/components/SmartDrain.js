import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import Wavify from 'react-wavify';
import Graph from './Graph';  // Import the Graph component
import DrainwaterTable from './DrainwaterTable';  // Import real-time data handler
import './SmartDrain.css';

import { FaBars } from 'react-icons/fa';  // Import the FaBars icon

import jsPDF from 'jspdf';  // Import jsPDF for PDF generation
import html2canvas from 'html2canvas';  // Import html2canvas for canvas to image conversion

const SmartDrain = () => {
  const [waterLevel, setWaterLevel] = useState(60);  // Default water level



  const [lastUpdated, setLastUpdated] = useState(null);  // Store the last update time

  const [isMenuOpen, setIsMenuOpen] = useState(false);  // State to toggle the menu

  const [reportGenerated, setReportGenerated] = useState(false);

  const [sensor1Data, setSensor1Data] = useState(null);
  const [sensor2Data, setSensor2Data] = useState(null);
  const [sensorData, setSensorData] = useState([]);  // Hold all sensor data

  const [depth1, setDepth1] = useState(54.56); // Depth for Sensor 01 This - the API
  const [depth2, setDepth2] = useState(36.1);  // Depth for Sensor 02
  
  const macAddress1 = "0C:B8:15:D7:33:D0";      // MAC address of Sensor 01
  const macAddress2 = "CC:DB:A7:30:4A:B0";       // MAC address of Sensor 02



    // Function to handle opening and closing the menu
    const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };
  

    // Logout handler function
    const handleLogout = () => {
      // Clear authentication data (localStorage or other session data)
      localStorage.removeItem('authToken');  // Replace with your session/token key
      // Redirect to the login page
      window.location.href = '/login';  // Replace '/login' with the correct login route
    };

    


// Fetch data function
const fetchData = async () => {
  try {
    // Fetch data for Sensor 01
    const response1 = await fetch(`http://64.227.152.179:8080/drainwater-0.1/drainwater/macAddress?macAddress=${macAddress1}`);
    const result1 = await response1.json();
    const sensor1DataList = result1.DrnList || [];
    const latestSensor1Data = sensor1DataList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    setSensor1Data(latestSensor1Data);
    console.log('Sensor 01 Data:', latestSensor1Data);


    // Fetch data for Sensor 02
    const response2 = await fetch(`http://64.227.152.179:8080/drainwater-0.1/drainwater/macAddress?macAddress=${macAddress2}`);
    const result2 = await response2.json();
    const sensor2DataList = result2.DrnList || [];
    const latestSensor2Data = sensor2DataList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    setSensor2Data(latestSensor2Data);
    console.log('Sensor 02 Data:', latestSensor2Data);


    // Combine data for graphing or other purposes
    setSensorData([...sensor1DataList, ...sensor2DataList]);

    updateLastUpdatedTime(); // Update the timestamp
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

useEffect(() => {
  fetchData(); // Initial data fetch
  const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
  return () => clearInterval(interval); // Cleanup on unmount
}, []);


  useEffect(() => {
    fetchData(); // Initial data fetch
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  console.log('Sensor 02 Data:', sensor2Data);
  console.log('depth2:', depth2);

  

  // Update sensor 1 and sensor 2 data whenever new sensor data is received
  useEffect(() => {
    fetchData(); // Initial data fetch
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);
  

  // Normalize water depth for display
  const normalizeWaterDepth = (distance) => {
    const maxDistance = 300;
    const normalizedLevel = ((maxDistance - distance) / maxDistance) * 100;
    return Math.max(0, Math.min(normalizedLevel, 100));  
  };

  const calculateVelocity = (distance, depth) => {
    const depthDistance = depth - distance;
    if (depthDistance <= 0) {
      return 0;
    }
    const numerator = 0.006 * depthDistance;
    const denominator = 0.02 * depthDistance + 0.6;
    const fraction = numerator / denominator;
    const power = Math.pow(fraction, 2 / 3);
    const velocity = (1 / 0.015) * power * Math.sqrt(0.010936);
    return velocity.toFixed(5);
  };
  
  const calculateFlowRate = (velocity, distance, depth) => {
    const depthDistance = depth - distance;
    if (depthDistance <= 0) {
      return 0;
    }
    const flowRate = velocity * 0.006 * depthDistance;
    return flowRate.toFixed(5);
  };
  
  // In the rendering part for Sensor 01
console.log('Sensor 01 Data:', sensor1Data);
console.log('depth1:', depth1);


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



  // Function to generate a PDF report
    const handleGenerateReport = () => {
      const input = document.querySelector('.graph-container'); // Assuming the chart is in a div with this class

      html2canvas(input).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');

      // Get the dimensions of the canvas
    const imgWidth = 210;  // A4 width in mm
    const pageHeight = 295;  // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;  // Maintain aspect ratio
    let heightLeft = imgHeight;

    const pdf = new jsPDF('p', 'mm', 'a4');  // Create PDF of A4 size
    let position = 0;

    // If the content is higher than a single page
    if (heightLeft > pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      position -= pageHeight;

      // Add more pages if necessary
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    } else {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    }

    pdf.save("report.pdf");
  });
};

  return (
    // JSX code 
<Container fluid className="smart-drain-system">
  <Row className="d-flex justify-content-center align-items-center">
    <Col md={10} className="text-center">
      <h1 className="headline">SMART DRAIN WATER SYSTEM</h1>
    </Col>
    <Col md={2} className="d-flex justify-content-end">
      {/* Hamburger Icon */}
      <FaBars className="hamburger-icon" onClick={toggleMenu} />
    </Col>
  </Row>

  {/* Menu Sidebar */}
  <div className={`menu-sidebar ${isMenuOpen ? 'open' : ''}`}>
    <Button onClick={handleLogout} className="menu-button">Logout</Button>
    <Button onClick={handleGenerateReport} className="close-sidebar">Generate Report</Button>
    {reportGenerated && <p className="report-status">Report has been successfully generated!</p>}

    <Button className="close-sidebar" onClick={toggleMenu}>Close Sidebar</Button> {/* Close button */}
  </div>

    {/* Overlay to close the sidebar when clicking outside */}
    {isMenuOpen && <div className="menu-overlay" onClick={toggleMenu}></div>}

      <Card className="parent-card">
        <Row>
          <Col md={{ span: 5, offset: 1 }} className="d-flex justify-content-center">
            <Card.Body className="tank-container">
              {/* Add Logout Button here */}
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
                  {/* Vertical measurement with arrows -- 450 -- */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '-50px', // Move left to position the arrow and measurement
                      top: '65%',
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
                    <p>
                    <strong>SPEED:</strong>{' '}
          {sensor1Data ? (
            (() => {
              const distance = parseFloat(sensor1Data.distance);
              const depth = parseFloat(depth1);
              console.log('Sensor 01 - distance:', distance, 'depth:', depth);
              if (isNaN(distance) || isNaN(depth)) {
                console.error('Invalid distance or depth for Sensor 01');
                return 'N/A';
              }
              const speed = calculateVelocity(distance, depth);
              return speed + ' m/s';
            })()
          ) : (
            <div className="skeleton text"></div>
          )}
                    </p>
                    <p>
                      <strong>WATER DEPTH:</strong>{' '}
                      {sensor1Data ? (
                        (() => {
                          const depth = parseFloat(depth1);
                          const distance = parseFloat(sensor1Data.distance);
                          if (isNaN(depth) || isNaN(distance)) {
                            console.error('Invalid depth or distance for Sensor 01');
                            return 'N/A';
                          }
                          const waterDepth = depth - distance;
                          return waterDepth.toFixed(2) + ' m';
                        })()
                      ) : (
                        <div className="skeleton text"></div>
                      )}
                    </p>
                    <p>
                    <strong>FLOW RATE:</strong>{' '}
          {sensor1Data ? (
            (() => {
              const distance = parseFloat(sensor1Data.distance);
              const depth = parseFloat(depth1);
              if (isNaN(distance) || isNaN(depth)) {
                console.error('Invalid distance or depth for Sensor 01');
                return 'N/A';
              }
              const velocity = calculateVelocity(distance, depth);
              const flowRate = calculateFlowRate(velocity, distance, depth);
              return flowRate + ' m³/s';
            })()
          ) : (
            <div className="skeleton text"></div>
          )}
                    </p>
                  </div>
                </div>

                  <p className="battery-label">
                    BATTERY LEVEL: {sensor1Data ? (
                      sensor1Data.voltage
                    ) : (
                      <div className="skeleton text"></div> /* Skeleton Loader */
                    )}
                  </p>
      {/* Date and Time inside sensor-values div */}
      <div className="sensor-values">
        <p>
          <strong>DATE:</strong>{' '}
          {sensor1Data ? (
            formatTimestamp(sensor1Data.timestamp).date
          ) : (
            <div className="skeleton text"></div> /* Skeleton Loader for Date */
          )}
        </p>
        <p>
          <strong>TIME:</strong>{' '}
          {sensor1Data ? (
            formatTimestamp(sensor1Data.timestamp).time
          ) : (
            <div className="skeleton text"></div> /* Skeleton Loader for Time */
          )}
        </p>
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
        <p>
        <strong>SPEED:</strong>{' '}
          {sensor2Data ? (
            (() => {
              const distance = parseFloat(sensor2Data.distance);
              const depth = parseFloat(depth1);
              console.log('Sensor 01 - distance:', distance, 'depth:', depth);
              if (isNaN(distance) || isNaN(depth)) {
                console.error('Invalid distance or depth for Sensor 01');
                return 'N/A';
              }
              const speed = calculateVelocity(distance, depth);
              return speed + ' m/s';
            })()
          ) : (
            <div className="skeleton text"></div>
          )}
        </p>
        <p>
            <strong>WATER DEPTH:</strong>{' '}
            {sensor2Data ? (
              (() => {
                const depth = parseFloat(depth2);
                const distance = parseFloat(sensor2Data.distance);
                if (isNaN(depth) || isNaN(distance)) {
                  console.error('Invalid depth or distance for Sensor 02');
                  return 'N/A';
                }
                const waterDepth = depth - distance;
                return waterDepth.toFixed(2) + ' m';
              })()
            ) : (
              <div className="skeleton text"></div>
            )}
          </p>

        <p>
        <strong>FLOW RATE:</strong>{' '}
          {sensor2Data ? (
            (() => {
              const distance = parseFloat(sensor2Data.distance);
              const depth = parseFloat(depth1);
              if (isNaN(distance) || isNaN(depth)) {
                console.error('Invalid distance or depth for Sensor 01');
                return 'N/A';
              }
              const velocity = calculateVelocity(distance, depth);
              const flowRate = calculateFlowRate(velocity, distance, depth);
              return flowRate + ' m³/s';
            })()
          ) : (
            <div className="skeleton text"></div>
          )}
        </p>
      </div>
    </div>

    <p className="battery-label">
      BATTERY LEVEL: {sensor2Data ? (
        sensor2Data.voltage
      ) : (
        <div className="skeleton text"></div>
      )}
    </p>

    <div className="sensor-values">
      <p>
        <strong>DATE:</strong>{' '}
        {sensor2Data ? (
          formatTimestamp(sensor2Data.timestamp).date
        ) : (
          <div className="skeleton text"></div>
        )}
      </p>
      <p>
        <strong>TIME:</strong>{' '}
        {sensor2Data ? (
          formatTimestamp(sensor2Data.timestamp).time
        ) : (
          <div className="skeleton text"></div>
        )}
      </p>
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
      <footer className="footer">
        <p>&copy; 2024 SmartDrain System. All rights reserved.</p>
        <a href="#">Contact Us</a> | <a href="#">Privacy Policy</a>
      </footer>

    </Container>
    
  );
};

export default SmartDrain;