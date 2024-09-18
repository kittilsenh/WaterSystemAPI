import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, TimeScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';
import { DatePicker } from 'antd';
import moment from 'moment'; // Import moment for date handling
import 'antd/dist/reset.css';

ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const DrainwaterChart = ({ sensorData }) => {
  const [startDate, setStartDate] = useState(moment().subtract(7, 'days')); // Default to 7 days ago
  const [endDate, setEndDate] = useState(moment()); // Default to today
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (sensorData && sensorData.length) {
      const filtered = sensorData.filter(
        (item) => moment(item.timestamp).isBetween(startDate, endDate, undefined, '[]')
      );
      setFilteredData(filtered);
    }
  }, [startDate, endDate, sensorData]);

  const chartData = {
    labels: filteredData.map((item) => item.timestamp),
    datasets: [
      {
        label: 'Flow Rate',
        data: filteredData.map((item) => item.flowRate),
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
      },
    ],
  };

  const chartOptions = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      <h2>Drainwater Chart</h2>
      <div>
        <span>Start Date:</span>
        <DatePicker
          value={startDate} // Use moment object for date value
          onChange={(date) => setStartDate(date)}
        />
        <span>End Date:</span>
        <DatePicker
          value={endDate} // Use moment object for date value
          onChange={(date) => setEndDate(date)}
        />
      </div>

      {filteredData.length > 0 ? (
        <Line data={chartData} options={chartOptions} />
      ) : (
        <p>No data available for the selected range.</p>
      )}
    </div>
  );
};

export default DrainwaterChart;