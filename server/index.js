require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

// FRED API base URL
const apiUrl = 'https://api.stlouisfed.org/fred/series/observations';

// Middleware to fetch data from the FRED API
const getFredData = async (seriesId) => {
    const apiKey = process.env.FRED_API_KEY; // Read API key from environment variable
    if (!apiKey) {
        throw new Error('API key is missing');
    }
    const url = `${apiUrl}?series_id=${seriesId}&api_key=${apiKey}&file_type=json`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        // Add series_id to the response
        data.series_id = seriesId;
        return data;
    } catch (error) {
        throw new Error('Error fetching data from FRED API');
    }
};

// Route to handle dynamic series requests
app.get('/:indicator', async (req, res) => {
    const { indicator } = req.params;
    try {
        const data = await getFredData(indicator);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
