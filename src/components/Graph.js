import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2'; // Use Line instead of Bar
import { Chart as ChartJS, TimeScale, LinearScale, LineElement, Title, Tooltip, Legend, PointElement } from 'chart.js';
import 'chartjs-adapter-date-fns'; // For date handling in chart.js

import zoomPlugin from 'chartjs-plugin-zoom';
ChartJS.register(zoomPlugin);


// Register the necessary elements for a line chart
ChartJS.register(TimeScale, LinearScale, LineElement, Title, Tooltip, Legend, PointElement);

const Graph = ({ sensorData }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);  // Default start date is today
  const [startTime, setStartTime] = useState('00:00');  // Default start time
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);  // Default end date is today
  const [endTime, setEndTime] = useState('23:59');  // Default end time
  const [filteredData, setFilteredData] = useState([]);

  const [loading, setLoading] = useState(true);  // New state for loading


  useEffect(() => {
    if (sensorData.length > 0) {
      setLoading(false);  // Turn off loading once data is available
    }
  }, [sensorData]);

  // Combine the date and time to create a full Date object
  const combineDateTime = (date, time) => new Date(`${date}T${time}`);

  // Filter data based on the selected date and time range
  useEffect(() => {
    const filtered = sensorData.filter((data) => {
      const date = new Date(data.timestamp);
      return date >= combineDateTime(startDate, startTime) && date <= combineDateTime(endDate, endTime);
    });
    setFilteredData(filtered);
  }, [sensorData, startDate, startTime, endDate, endTime]);

  // Prepare the data for the line chart
  const chartData = {
    labels: filteredData.map(data => new Date(data.timestamp)),  // x-axis (dates)
    datasets: [
      {
        label: 'Distance (m)',
        data: filteredData.map(data => data.distance),  // y-axis (distances)
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  // Options for the line chart
  const options = {
    scales: {
      x: {
        type: 'time',  // x-axis uses time
        time: {
          unit: 'hour',  // Group by day
          stepSize: 1,  // Display every hour
          displayFormats: {
            hour: 'h:mm a',
            '12AM': 'MM d',  // Display hour:minute AM/PM for hourly labels
            '12PM': 'MM d',  // Display month and day for daily labels
          },
          tooltipFormat: 'MMM d, h:mm a', // Format for tooltip (optional)
        },
        title: {
          display: true,
          text: 'Date and Time',  // Label for the x-axis
        },
        ticks: {
          autoSkip: true,  // Automatically skip ticks to avoid overcrowding
          maxTicksLimit: 24,  // Limit the number of ticks (adjust as needed)
          callback: function (value, index, values) {
            // Display the date at 12AM and 12PM
            const date = new Date(value);
            const hours = date.getHours();
            if (hours === 0 || hours === 12) {
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            // Otherwise, show only the time
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Distance (m)',  // Label for the y-axis
        },
      },
    },
    plugins: {
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
        <input 
          type="date" 
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)} 
        />
        <input 
          type="time" 
          value={startTime} 
          onChange={(e) => setStartTime(e.target.value)} 
        />
          <button className="clear-button" onClick={() => { setStartDate(''); setStartTime(''); }}>Clear</button>

        
        <label>End Date:</label>
        <input 
          type="date" 
          value={endDate} 
          onChange={(e) => setEndDate(e.target.value)} 
        />
        <input 
          type="time" 
          value={endTime} 
          onChange={(e) => setEndTime(e.target.value)} 
        />
          <button className="clear-button" onClick={() => { setEndDate(''); setEndTime(''); }}>Clear</button>

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
