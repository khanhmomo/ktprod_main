const https = require('https');

// Test PATCH request
const data = JSON.stringify({ 
  status: 'in_progress', 
  indexedPhotos: 5, 
  totalPhotos: 10 
});

const options = {
  hostname: 'thewildstudio.org',
  port: 443,
  path: '/api/customer-galleries/saew2sji',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing PATCH request to:', options.path);
console.log('Data:', data);

const req = https.request(options, (res) => {
  console.log('Response status:', res.statusCode);
  console.log('Response headers:', res.headers);
  
  res.on('data', (chunk) => {
    console.log('Response body:', chunk.toString());
  });
  
  res.on('end', () => {
    console.log('Request completed');
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(data);
req.end();
