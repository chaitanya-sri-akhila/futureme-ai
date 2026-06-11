const http = require('http');

const data = JSON.stringify({
  name: "Akhila",
  age: "22",
  goal: "secure a software engineer role, launch an ai startup",
  struggle: "lack of consistency, procrastination",
  oneYearVision: "working in an mnc in my core field ai",
  tone: "Calm Mentor (Stoic, reflective, high emotional intelligence)"
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/generate-futureme',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log('Response:', JSON.stringify(JSON.parse(responseData), null, 2));
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
