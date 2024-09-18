import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2'; // Use Line instead of Bar
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // For date handling in chart.js

import zoomPlugin from 'chartjs-plugin-zoom';
ChartJS.register(zoomPlugin);

// Register the necessary elements for a line chart
ChartJS.register(TimeScale, LinearScale, LineElement, Title, Tooltip, Legend, PointElement);

const Graph = ({ sensorData }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // Default start date is today
  const [startTime, setStartTime] = useState('00:00'); // Default start time
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Default end date is today
  const [endTime, setEndTime] = useState('23:59'); // Default end time
  const [filteredData, setFilteredData] = useState([]);

  const [loading, setLoading] = useState(true); // New state for loading

  // Define MAC addresses for sensors
  const sensor1MacAddress = '0C:B8:15:D7:33:D0';
  const sensor2MacAddress = 'CC:DB:A7:30:4A:B0';

  useEffect(() => {
    if (sensorData.length > 0) {
      setLoading(false); // Turn off loading once data is available
    }
  }, [sensorData]);

  // Combine the date and time to create a full Date object
  const combineDateTime = (date, time) => new Date(`${date}T${time}`);

  // Filter data based on the selected date and time range
  useEffect(() => {
    const filtered = sensorData.filter((data) => {
      const date = new Date(data.timestamp);
      return (
        date >= combineDateTime(startDate, startTime) && date <= combineDateTime(endDate, endTime)
      );
    });
    setFilteredData(filtered);
  }, [sensorData, startDate, startTime, endDate, endTime]);

  // Separate data for each sensor
  const sensor1Data = filteredData.filter((data) => data.macAddress === sensor1MacAddress);
  const sensor2Data = filteredData.filter((data) => data.macAddress === sensor2MacAddress);

  // Prepare the data for the line chart
  const chartData = {
    datasets: [
      {
        label: 'Sensor 01 Distance (m)',
        data: sensor1Data.map((data) => ({
          x: new Date(data.timestamp),
          y: data.distance,
        })),
        borderColor: 'rgba(75,192,192,1)', // Color for Sensor 01
        backgroundColor: 'rgba(75,192,192,0.2)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(75,192,192,1)',
      },
      {
        label: 'Sensor 02 Distance (m)',
        data: sensor2Data.map((data) => ({
          x: new Date(data.timestamp),
          y: data.distance,
        })),
        borderColor: 'rgba(255,99,132,1)', // Color for Sensor 02
        backgroundColor: 'rgba(255,99,132,0.2)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(255,99,132,1)',
      },
    ],
  };

  // Options for the line chart
  const options = {
    scales: {
      x: {
        type: 'time', // x-axis uses time
        time: {
          unit: 'hour', // Adjust the time unit as needed
          tooltipFormat: 'MMM d, h:mm a', // Format for tooltip
        },
        title: {
          display: true,
          text: 'Date and Time', // Label for the x-axis
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 24,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Distance (m)', // Label for the y-axis
        },
      },
    },
    plugins: {
      legend: {
        display: true, // Show legend to distinguish sensors
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'xy',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'xy',
        },
      },
    },
  };

  return (
    <div className="graph-container">
      <h2>Distance Over Time</h2>

      {/* Date and Time selection for the time interval */}
      <div className="date-selection">
        <label>Start Date:</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <button
          className="clear-button"
          onClick={() => {
            setStartDate('');
            setStartTime('');
          }}
        >
          Clear
        </button>

        <label>End Date:</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        <button
          className="clear-button"
          onClick={() => {
            setEndDate('');
            setEndTime('');
          }}
        >
          Clear
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="cool-spinner"></div>
          <p className="loading-text">Loading...</p> {/* Text with cool fade effect */}
        </div>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
};

export default Graph;
