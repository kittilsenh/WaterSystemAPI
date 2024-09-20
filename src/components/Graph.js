import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, TimeScale, LinearScale, LineElement, Title, Tooltip, Legend, PointElement } from 'chart.js';
import 'chartjs-adapter-date-fns';  // For date handling in chart.js

// Register components for the chart
ChartJS.register(TimeScale, LinearScale, LineElement, Title, Tooltip, Legend, PointElement);

const Graph = ({ sensor1DataList, sensor2DataList, startDate, startTime, endDate, endTime }) => {
  const [filteredSensor1Data, setFilteredSensor1Data] = useState([]);
  const [filteredSensor2Data, setFilteredSensor2Data] = useState([]);

  // Helper function to combine date and time
  const combineDateTime = (date, time) => {
    const combined = `${date}T${time}:00`;  // Ensure correct formatting with ':00' for seconds
    const dateTime = new Date(combined);
    
    if (isNaN(dateTime.getTime())) {
      console.error("Invalid date/time combination:", combined);
      return null;
    }
    
    return dateTime;
  };

  useEffect(() => {
    const start = combineDateTime(startDate, startTime);
    const end = combineDateTime(endDate, endTime);

    if (!start || !end) {
      console.error("Invalid start or end time");
      return;
    }

    // Filter Sensor 1 Data
    const filteredSensor1 = sensor1DataList
      .filter((data) => new Date(data.timestamp) >= start && new Date(data.timestamp) <= end)
      .map((data) => ({ x: new Date(data.timestamp), y: data.distance }));
    
    // Filter Sensor 2 Data
    const filteredSensor2 = sensor2DataList
      .filter((data) => new Date(data.timestamp) >= start && new Date(data.timestamp) <= end)
      .map((data) => ({ x: new Date(data.timestamp), y: data.distance }));

    // Set filtered data
    setFilteredSensor1Data(filteredSensor1);
    setFilteredSensor2Data(filteredSensor2);

  }, [sensor1DataList, sensor2DataList, startDate, startTime, endDate, endTime]);

  // Chart options
  const options = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          tooltipFormat: 'MMM d, h:mm a',
        },
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Distance (m)',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
      },
    },
    spanGaps: false, // This will break the line if there are any missing data points
  };

  // Prepare data for the chart
  const chartData = {
    datasets: [
      {
        label: 'Sensor 01 Distance (m)',
        data: filteredSensor1Data,
        borderColor: 'rgba(75,192,192,1)',  // Blue for Sensor 01
        backgroundColor: 'rgba(75,192,192,0.2)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(75,192,192,1)',
        showLine: false,  // Disable line between points
      },
      {
        label: 'Sensor 02 Distance (m)',
        data: filteredSensor2Data,
        borderColor: 'rgba(255,99,132,1)',  // Red for Sensor 02
        backgroundColor: 'rgba(255,99,132,0.2)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(255,99,132,1)',
        showLine: false,  // Disable line between points
      },
    ],
  };

  return (
    <div>
      <h3>Sensor Data Over Time</h3>
      {filteredSensor1Data.length === 0 && filteredSensor2Data.length === 0 ? (
        <p>No data available for the selected time range.</p>
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
};

export default Graph;
