const https = require('https');

// Test GET request to see galleries
const options = {
  hostname: 'thewildstudio.org',
  port: 443,
  path: '/api/customer-galleries',
  method: 'GET'
};

console.log('Fetching galleries...');

const req = https.request(options, (res) => {
  console.log('Response status:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', data);
    try {
      const galleries = JSON.parse(data);
      console.log('\nAlbum codes found:');
      galleries.forEach((gallery, index) => {
        console.log(`${index + 1}. ${gallery.albumCode} (${gallery.photos?.length || 0} photos)`);
      });
    } catch (e) {
      console.log('Failed to parse JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();
