import React, { useState } from 'react';
import { FaUser, FaLock } from 'react-icons/fa';
import Wavify from 'react-wavify'; // Import Wavify for waves
import './Login.css';

const WaterTank = () => (
  <div className="login-water-tank-container">
    <div className="login-water-tank">
      {/* Adding waves */}
      <Wavify
        fill="#00aaff"  // Wave color
        paused={false}
        options={{
          height: 20,
          amplitude: 15,
          speed: 0.2,
          points: 3,
        }}
        className="login-waves" // Ensure waves are scoped to the login page
      />
    </div>
  </div>
);

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Prepare the login data
    const loginData = {
      username,
      password,
    };

    try {
      // Send the POST request to the API endpoint
      const response = await fetch('http://64.227.152.179:8080/drainwater-0.1/drainwater/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      // Handle the response from the API
      if (response.ok && result.status === 'Login successful') {
        // Perform login action (you can redirect the user or do something else)
        onLogin();
      } else {
        // Display an error message if login fails
        setError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again later.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="login-page">
      <div className="login-info-section">
        <h2>About SmartDrain</h2>
        <p>
          SmartDrain is a modern solution for monitoring and managing water
          drainage systems. Our technology helps prevent flooding, manage water
          levels, and ensure efficient drainage.
        </p>
        <WaterTank />
      </div>

      <div className="login-section">
        <div className="login-header">
          <h1>SmartDrain Login</h1>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-container">
            <FaUser className="login-input-icon" />
            <input
              type="text"
              id="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="login-input-container">
            <FaLock className="login-input-icon" />
            <input
              type="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="login-error-message">{error}</p>}
          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="login-spinner"></span> // Add spinner here if necessary
            ) : 'Login'}
          </button>
          <div className="login-forgot-password">
            <a href="#">Forgot Password?</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;