import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import Wavify from 'react-wavify';
import Graph from './Graph';  // Import the Graph component
import DrainwaterTable from './DrainwaterTable';  // Import real-time data handler
import './SmartDrain.css';
import SockJS from 'sockjs-client';  // Import SockJS for WebSocket connection
import { Stomp } from '@stomp/stompjs';  // Import Stomp for WebSocket messaging
import { FaBars } from 'react-icons/fa';  // Import the FaBars icon
import jsPDF from 'jspdf';  // Import jsPDF for PDF generation
import html2canvas from 'html2canvas';  // Import html2canvas for canvas to image conversion
import * as XLSX from 'xlsx';  // Import XLSX for Excel export
import autoTable from 'jspdf-autotable';  // Import for table generation

const SOCKET_URL = 'http://64.227.152.179:8080/drainwater-0.1/ws';  // WebSocket URL

const SmartDrain = () => {
  const [waterLevel, setWaterLevel] = useState(60);  // Default water level
  const [lastUpdated, setLastUpdated] = useState(null);  // Store the last update time
  const [isMenuOpen, setIsMenuOpen] = useState(false);  // State to toggle the menu
  const [reportGenerated, setReportGenerated] = useState(false);
  const [sensor1Data, setSensor1Data] = useState(null);
  const [sensor2Data, setSensor2Data] = useState(null);
  const [sensorData, setSensorData] = useState([]);  // Hold all sensor data

  const graphRef = useRef(null);  // Define graphRef using useRef

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);  // Start date
  const [startTime, setStartTime] = useState('00:00');  // Start time
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);  // End date
  const [endTime, setEndTime] = useState('23:59');  // End time

  const depth1 = 54.56; // Depth for Sensor 01 This - the API
  const depth2 = 36.1;  // Depth for Sensor 02
  
  const macAddress1 = "0C:B8:15:D7:33:D0";      // MAC address of Sensor 01
  const macAddress2 = "CC:DB:A7:30:4A:B0";      // MAC address of Sensor 02

    // Function to handle opening and closing the menu
    const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };
  
  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');  // Replace with your session/token key
    window.location.href = '/login';  // Replace '/login' with the correct login route
  };

    const [sensor1DataList, setSensor1DataList] = useState([]);
    const [sensor2DataList, setSensor2DataList] = useState([]);

      // Fetch historical data from the backend when the page loads
// Fetch historical data from the backend when the page loads
useEffect(() => {
  const fetchHistoricalData = async () => {
    try {
      // Fetch data for Sensor 01
      const response1 = await fetch(`http://64.227.152.179:8080/drainwater-0.1/drainwater/macAddress?macAddress=${macAddress1}`);
      const result1 = await response1.json();
      const sensor1HistoricalData = result1.DrnList || [];
      const latestSensor1Data = sensor1HistoricalData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      setSensor1DataList(sensor1HistoricalData);  // Set all historical data
      setSensor1Data(latestSensor1Data); // Set the most recent data for display

      console.log('Sensor 01 Data:', latestSensor1Data);

      // Fetch data for Sensor 02
      const response2 = await fetch(`http://64.227.152.179:8080/drainwater-0.1/drainwater/macAddress?macAddress=${macAddress2}`);
      const result2 = await response2.json();
      const sensor2HistoricalData = result2.DrnList || [];
      const latestSensor2Data = sensor2HistoricalData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      setSensor2DataList(sensor2HistoricalData);  // Set all historical data
      setSensor2Data(latestSensor2Data); // Set the most recent data for display

      console.log('Sensor 02 Data:', latestSensor2Data);
      
    } catch (error) {
      console.error("Error fetching historical data:", error);
    }
  };

  fetchHistoricalData();
}, []);

    
useEffect(() => {
  const socket = new SockJS(SOCKET_URL);
  const stompClient = Stomp.over(socket);

  stompClient.connect({}, () => {
    stompClient.subscribe('/topic/drainwater', (message) => {
      const newDrn = JSON.parse(message.body);
      const macAddress = newDrn.macAddress;

      if (macAddress === macAddress1) {
        setSensor1Data(newDrn);  // Update Sensor 01 Data
        setSensor1DataList(prevData => [...prevData, newDrn]);  // Append new data to the list
      } else if (macAddress === macAddress2) {
        setSensor2Data(newDrn);  // Update Sensor 02 Data
        setSensor2DataList(prevData => [...prevData, newDrn]);  // Append new data to the list
      }

      setLastUpdated(new Date().toLocaleTimeString());  // Update last update time
    });
  });

  return () => {
    if (stompClient) {
      stompClient.disconnect();
    }
  };
}, []);

    const handleStartDateChange = (event) => setStartDate(event.target.value);
    const handleStartTimeChange = (event) => setStartTime(event.target.value);
    const handleEndDateChange = (event) => setEndDate(event.target.value);
    const handleEndTimeChange = (event) => setEndTime(event.target.value);

  const updateLastUpdatedTime = () => {
    const currentTime = new Date().toLocaleTimeString();
    setLastUpdated(currentTime);
  };

    // Function to generate the PDF report
    const handleGenerateReport = async () => {
      if (!graphRef.current) {
        console.error('Graph element not found');
        return;
      }
    
      try {
        const canvas = await html2canvas(graphRef.current);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    
        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = new Date(`${endDate}T${endTime}`);
    
        const filteredSensor1Data = sensor1DataList.filter(data => {
          const dataDateTime = new Date(data.timestamp);
          return dataDateTime >= startDateTime && dataDateTime <= endDateTime;
        });
    
        const filteredSensor2Data = sensor2DataList.filter(data => {
          const dataDateTime = new Date(data.timestamp);
          return dataDateTime >= startDateTime && dataDateTime <= endDateTime;
        });
    
        // Prepare table data for the PDF, including MAC Addresses, Voltage, Speed (Velocity), and Flow Rate
        const tableStartY = imgHeight + 20;
        const tableData = filteredSensor1Data.map((data, index) => [
          new Date(data.timestamp).toLocaleString(),
          macAddress1, // MAC Address for Sensor 1
          data.distance,
          data.voltage || 'N/A', // Voltage for Sensor 1
          calculateVelocity(data.distance, depth1), // Speed for Sensor 1
          calculateFlowRate(calculateVelocity(data.distance, depth1), data.distance, depth1), // Flow Rate for Sensor 1
          macAddress2, // MAC Address for Sensor 2
          filteredSensor2Data[index]?.distance || 'N/A',
          filteredSensor2Data[index]?.voltage || 'N/A', // Voltage for Sensor 2
          filteredSensor2Data[index] ? calculateVelocity(filteredSensor2Data[index].distance, depth2) : 'N/A', // Speed for Sensor 2
          filteredSensor2Data[index] ? calculateFlowRate(calculateVelocity(filteredSensor2Data[index].distance, depth2), filteredSensor2Data[index].distance, depth2) : 'N/A', // Flow Rate for Sensor 2
        ]);
    
        // Add the table to the PDF, including MAC Address, Voltage, Speed, and Flow Rate
        autoTable(pdf, {
          startY: tableStartY,
          head: [['Timestamp', 'Sensor 1 MAC Address', 'Distance (m)', 'Voltage', 'Speed (m/s)', 'Flow Rate (m³/s)', 'Sensor 2 MAC Address', 'Distance (m)', 'Voltage', 'Speed (m/s)', 'Flow Rate (m³/s)']],
          body: tableData,
        });
    
        // Save filtered data to Excel as well
        generateExcel(filteredSensor1Data, filteredSensor2Data, startDate, startTime, endDate, endTime);
    
        // Save the PDF file
        pdf.save('graph-report-with-table.pdf');
    
      } catch (error) {
        console.error('Error generating report:', error);
      }
    };
    
    
    
  
    // Function to generate an Excel file with sensor data
    const generateExcel = (sensor1DataList, sensor2DataList, startDate, startTime, endDate, endTime) => {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
    
      const filteredSensor1Data = sensor1DataList.filter(data => {
        const dataDateTime = new Date(data.timestamp);
        return dataDateTime >= startDateTime && dataDateTime <= endDateTime;
      });
    
      const filteredSensor2Data = sensor2DataList.filter(data => {
        const dataDateTime = new Date(data.timestamp);
        return dataDateTime >= startDateTime && dataDateTime <= endDateTime;
      });
    
      // Include MAC addresses, Voltage, Speed (Velocity), and Flow Rate in the Excel sheet
      const wsData = [
        ['Timestamp', 'Sensor 1 MAC Address', 'Sensor 1 Distance (m)', 'Sensor 1 Voltage', 'Sensor 1 Speed (m/s)', 'Sensor 1 Flow Rate (m³/s)', 'Sensor 2 MAC Address', 'Sensor 2 Distance (m)', 'Sensor 2 Voltage', 'Sensor 2 Speed (m/s)', 'Sensor 2 Flow Rate (m³/s)'],
        ...filteredSensor1Data.map((data, index) => [
          data.timestamp,
          macAddress1, // MAC Address for Sensor 1
          data.distance,
          data.voltage || 'N/A', // Voltage for Sensor 1
          calculateVelocity(data.distance, depth1), // Speed for Sensor 1
          calculateFlowRate(calculateVelocity(data.distance, depth1), data.distance, depth1), // Flow Rate for Sensor 1
          macAddress2, // MAC Address for Sensor 2
          filteredSensor2Data[index]?.distance || 'N/A',
          filteredSensor2Data[index]?.voltage || 'N/A', // Voltage for Sensor 2
          filteredSensor2Data[index] ? calculateVelocity(filteredSensor2Data[index].distance, depth2) : 'N/A', // Speed for Sensor 2
          filteredSensor2Data[index] ? calculateFlowRate(calculateVelocity(filteredSensor2Data[index].distance, depth2), filteredSensor2Data[index].distance, depth2) : 'N/A', // Flow Rate for Sensor 2
        ]),
      ];
    
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'SensorData');
      XLSX.writeFile(wb, 'sensor-data.xlsx');
    };
    
    
    


  // Function to calculate velocity
  const calculateVelocity = (distance, depth) => {
    const depthDistance = depth - distance;
    if (depthDistance <= 0) return 0;

    const velocity = (1 / 0.015) *
      Math.pow((0.006 * depthDistance) / (0.02 * depthDistance + 0.6), 2 / 3) *
      Math.sqrt(0.010936);

    return velocity.toFixed(5);  // Return calculated velocity
  };
  
  // Function to calculate flow rate
  const calculateFlowRate = (velocity, distance, depth) => {
    const depthDistance = depth - distance;
    if (depthDistance <= 0) return 0;

    const flowRate = velocity * 0.006 * depthDistance;
    return flowRate.toFixed(5);  // Return calculated flow rate
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

  const handleGenerateXLSXReport = () => {
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
  
    // Filter Sensor 1 and Sensor 2 data based on the given time interval
    const filteredSensor1Data = sensor1DataList.filter(data => {
      const dataDateTime = new Date(data.timestamp);
      return dataDateTime >= startDateTime && dataDateTime <= endDateTime;
    });
  
    const filteredSensor2Data = sensor2DataList.filter(data => {
      const dataDateTime = new Date(data.timestamp);
      return dataDateTime >= startDateTime && dataDateTime <= endDateTime;
    });
  
    // Prepare the Excel data
    const wsData = [
      ['Timestamp', 'Sensor 1 MAC', 'Sensor 1 Distance', 'Sensor 1 Voltage', 'Sensor 1 Speed', 'Sensor 1 Flow', 'Sensor 2 MAC', 'Sensor 2 Distance', 'Sensor 2 Voltage', 'Sensor 2 Speed', 'Sensor 2 Flow'],
      ...filteredSensor1Data.map((data, index) => [
        data.timestamp,
        macAddress1, // Sensor 1 MAC Address
        data.distance,
        data.voltage || 'N/A',
        calculateVelocity(data.distance, depth1),
        calculateFlowRate(calculateVelocity(data.distance, depth1), data.distance, depth1),
        macAddress2, // Sensor 2 MAC Address
        filteredSensor2Data[index]?.distance || 'N/A',
        filteredSensor2Data[index]?.voltage || 'N/A',
        filteredSensor2Data[index] ? calculateVelocity(filteredSensor2Data[index].distance, depth2) : 'N/A',
        filteredSensor2Data[index] ? calculateFlowRate(calculateVelocity(filteredSensor2Data[index].distance, depth2), filteredSensor2Data[index].distance, depth2) : 'N/A',
      ]),
    ];
  
    // Create a new workbook and sheet, and write the file as .xlsx
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'SensorData');
    XLSX.writeFile(wb, 'sensor-data.xlsx'); // Save the file as .xlsx
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

    <Button onClick={handleGenerateXLSXReport} className="close-sidebar">
    Generate Excel (.xlsx)
    </Button>

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

          {/* Sensor 01 */}
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
              calculateVelocity(sensor1Data.distance, depth1) + ' m/s'
            ) : (
              <div className="skeleton text"></div>
            )}
          </p>
          <p>
            <strong>WATER DEPTH:</strong>{' '}
            {sensor1Data ? (
              (depth1 - sensor1Data.distance).toFixed(2) + ' m'
            ) : (
              <div className="skeleton text"></div>
            )}
          </p>
          <p>
            <strong>FLOW RATE:</strong>{' '}
            {sensor1Data ? (
              calculateFlowRate(
                calculateVelocity(sensor1Data.distance, depth1),
                sensor1Data.distance,
                depth1
              ) + ' m³/s'
            ) : (
              <div className="skeleton text"></div>
            )}
          </p>
        </div>
      </div>

      <p className="battery-label">
        <strong>BATTERY LEVEL:</strong>{' '}
        {sensor1Data ? (
          sensor1Data.voltage
        ) : (
          <div className="skeleton text"></div>
        )}
      </p>

      {/* Date and Time inside sensor-values div */}
      <div className="sensor-values">
        <p>
          <strong>DATE:</strong>{' '}
          {sensor1Data ? (
            formatTimestamp(sensor1Data.timestamp).date
          ) : (
            <div className="skeleton text"></div>
          )}
        </p>
        <p>
          <strong>TIME:</strong>{' '}
          {sensor1Data ? (
            formatTimestamp(sensor1Data.timestamp).time
          ) : (
            <div className="skeleton text"></div>
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
              calculateVelocity(sensor2Data.distance, depth2) + ' m/s'
            ) : (
              <div className="skeleton text"></div>
            )}
          </p>
          <p>
            <strong>WATER DEPTH:</strong>{' '}
            {sensor2Data ? (
              (depth2 - sensor2Data.distance).toFixed(2) + ' m'
            ) : (
              <div className="skeleton text"></div>
            )}
          </p>
          <p>
            <strong>FLOW RATE:</strong>{' '}
            {sensor2Data ? (
              calculateFlowRate(
                calculateVelocity(sensor2Data.distance, depth2),
                sensor2Data.distance,
                depth2
              ) + ' m³/s'
            ) : (
              <div className="skeleton text"></div>
            )}
          </p>
        </div>
      </div>

      <p className="battery-label">
        <strong>BATTERY LEVEL:</strong>{' '}
        {sensor2Data ? (
          sensor2Data.voltage
        ) : (
          <div className="skeleton text"></div>
        )}
      </p>

      {/* Date and Time inside sensor-values div */}
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


      {/* Time Interval Selection */}

{/* Time Interval Selection and Graph Container */}
<div className="time-interval-graph-container">
  <Row className="time-interval-selection">
    <Col md={3}>
      <Form.Group>
        <Form.Label>Start Date</Form.Label>
        <Form.Control type="date" value={startDate} onChange={handleStartDateChange} />
        <Form.Label>Start Time</Form.Label>
        <Form.Control type="time" value={startTime} onChange={handleStartTimeChange} />
      </Form.Group>
    </Col>
    <Col md={3}>
      <Form.Group>
        <Form.Label>End Date</Form.Label>
        <Form.Control type="date" value={endDate} onChange={handleEndDateChange} />
        <Form.Label>End Time</Form.Label>
        <Form.Control type="time" value={endTime} onChange={handleEndTimeChange} />
      </Form.Group>
    </Col>
  </Row>

  {/* Graph Container */}
  <div className="graph-wrapper" ref={graphRef}>
    <Graph
      sensor1DataList={sensor1DataList}
      sensor2DataList={sensor2DataList}
      startDate={startDate}
      startTime={startTime}
      endDate={endDate}
      endTime={endTime}
    />
  </div>
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