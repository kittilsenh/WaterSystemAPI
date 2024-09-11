import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

function DrainwaterTable({ onFilterData }) {
    const [data, setData] = useState([]);

    // Fetch initial data from the API
    const fetchData = async () => {
        try {
            const response = await fetch('http://64.227.152.179:8080/drainwater-0.1/drainwater/all');
            const result = await response.json();
            if (result.DrnList && result.DrnList.length > 0) {
                const latestData = result.DrnList.slice(-2);  // Get the last two entries
                console.log('Initial API Data:', latestData); // Log the initial data
                onFilterData(latestData);  // Pass the latest data
                setData(result.DrnList);  // Store the full list
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        const socket = new SockJS('http://64.227.152.179:8080/drainwater-0.1/ws'); // Create SockJS connection
        const stompClient = Stomp.over(() => socket); // Pass SockJS as a factory to Stomp.over
    
        stompClient.connect({}, () => {
            stompClient.subscribe('/topic/drainwater', (message) => {
                const newDrn = JSON.parse(message.body);  // Parse the new message
                console.log('WebSocket Update:', newDrn); // Log WebSocket data
                setData(prevData => {
                    const updatedData = [...prevData, newDrn];
                    const latestData = updatedData.slice(-2);  // Get the last two entries
                    onFilterData(latestData);  // Pass to the parent
                    return updatedData;  // Return updated data
                });
            });
        });
    
        return () => {
            if (stompClient) {
                stompClient.disconnect();
            }
        };
    }, [onFilterData]);

    return null;  // No UI needed here
}

export default DrainwaterTable;
