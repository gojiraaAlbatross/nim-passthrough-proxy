const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const NIM_API_BASE = 'https://integrate.api.nvidia.com/v1';
const NIM_API_KEY = process.env.NIM_API_KEY;

if (!NIM_API_KEY) {
  console.error('Missing NIM_API_KEY environment variable');
  process.exit(1);
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'NIM Passthrough Proxy (no aliases)' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/v1/chat/completions', async (req, res) => {
  try {
    const response = await axios({
      method: 'post',
      url: `${NIM_API_BASE}/chat/completions`,
      headers: {
        'Authorization': `Bearer ${NIM_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: req.body,
      responseType: req.body.stream ? 'stream' : 'json',
      timeout: 120000
    });

    if (req.body.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      response.data.pipe(res);
    } else {
      res.json(response.data);
    }
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || { error: error.message };
    res.status(status).json(message);
  }
});

app.listen(PORT, () => {
  console.log(`NIM Passthrough Proxy running on port ${PORT}`);
});
