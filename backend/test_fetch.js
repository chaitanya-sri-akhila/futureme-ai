require('dotenv').config();
const https = require('https');

console.log("Testing raw HTTPS GET to generativelanguage.googleapis.com with API key...");
const apiKey = process.env.GEMINI_API_KEY;
console.log(`API Key prefix: ${apiKey ? apiKey.substring(0, 5) : 'NONE'}`);

https.get(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Response Body (truncated):", data.substring(0, 800));
  });
}).on('error', (err) => {
  console.error("Network Fetch Error Stack:", err);
});
