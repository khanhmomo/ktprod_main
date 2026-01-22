// Check what the API is returning
const https = require('https');

async function checkApiResponse() {
  console.log('🔍 Checking API response...');
  
  const options = {
    hostname: 'thewildstudio.org',
    port: 443,
    path: '/api/customer-galleries',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const galleries = JSON.parse(data);
          console.log(`\n📊 API returned ${galleries.length} galleries`);
          
          galleries.forEach((gallery, index) => {
            console.log(`\n${index + 1}. ${gallery.albumCode}`);
            console.log(`   Customer: ${gallery.customerName}`);
            console.log(`   Status: ${gallery.status}`);
            console.log(`   Face Recognition: ${gallery.faceRecognitionEnabled}`);
            console.log(`   Has field: ${gallery.hasOwnProperty('faceRecognitionEnabled')}`);
          });
          
          resolve(galleries);
        } catch (e) {
          console.error('❌ Failed to parse response:', e);
          console.log('Raw response:', data);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error);
      reject(error);
    });

    req.end();
  });
}

checkApiResponse().catch(console.error);
