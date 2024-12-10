const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = 3000;

// Firebase Configuration
const firebaseUrl = 'https://iot12938-default-rtdb.europe-west1.firebasedatabase.app/'; 
const firebaseSecret = 'vAdM3u0NRS0IV9h5WBwMfNTmDV3MChpFgvkznPM7'; 

// Configure Express
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Login route
app.get('/login', (req, res) => {
  res.render('login');
});

// Handle login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Fetch devices from Firebase
    const response = await axios.get(`${firebaseUrl}/devices.json?auth=${firebaseSecret}`);
    const devices = response.data;

    if (!devices) {
      return res.status(401).send('No devices found');
    }

    // Find the matching device
    const device = Object.values(devices).find(
      (d) => d.login === username && d.password === password
    );

    if (!device) {
      return res.status(401).send('Invalid username or password');
    }

    // Redirect to home page with device_id as a query parameter
    res.redirect(`/home?device_id=${device.device_id}`);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Home route
app.get('/home', async (req, res) => {
  const { device_id } = req.query;

  if (!device_id) {
    return res.status(400).send('Device ID is required');
  }

  try {
    // Fetch metrics for the device
    const response = await axios.get(`${firebaseUrl}/metrics/${device_id}.json?auth=${firebaseSecret}`);
    const metrics = response.data;

    if (!metrics) {
      return res.render('home', { device_id, metrics: [], error: 'No metrics found for this device.' });
    }

    // Convert metrics to an array for easier rendering
    const metricsArray = Object.entries(metrics).map(([timestamp, data]) => ({
      timestamp,
      ...data,
    }));

    res.render('home', { device_id, metrics: metricsArray });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
