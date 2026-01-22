#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const https = require('https');

const SERVER_URL = 'https://thewildstudio.org';
const POLL_INTERVAL = 5000; // Update every 5 seconds for real-time

// Helper function to make HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Get all galleries from server
async function getGalleries() {
  try {
    const response = await makeRequest(`${SERVER_URL}/api/customer-galleries`);
    return response;
  } catch (error) {
    console.error('Error fetching galleries:', error);
    return [];
  }
}

// Clear terminal and show table
function displayAlbumsTable(galleries) {
  console.clear();
  console.log('\n' + '='.repeat(80));
  console.log('CUSTOMER ALBUMS - FACE INDEXING STATUS');
  console.log('='.repeat(80));
  console.log('Album Code'.padEnd(15) + ' | ' + 'Photos'.padEnd(8) + ' | ' + 'Indexed'.padEnd(8) + ' | ' + 'Status'.padEnd(12) + ' | ' + 'Progress');
  console.log('-'.repeat(80));
  
  galleries.forEach(gallery => {
    const indexing = gallery.faceIndexing || {};
    const status = indexing.status || 'not_started';
    const indexed = indexing.indexedPhotos || 0;
    const total = indexing.totalPhotos || (gallery.photos?.length || 0);
    
    let statusDisplay = status;
    let progressDisplay = '';
    
    if (status === 'in_progress') {
      statusDisplay = 'PROGRESSING';
      progressDisplay = `${indexed}/${total}`;
    } else if (status === 'completed') {
      statusDisplay = 'COMPLETED';
      progressDisplay = `${indexed}/${total}`;
    } else if (status === 'failed') {
      statusDisplay = 'FAILED';
      progressDisplay = `${indexed}/${total}`;
    } else {
      statusDisplay = 'PENDING';
      progressDisplay = `0/${total}`;
    }
    
    console.log(
      gallery.albumCode.padEnd(15) + ' | ' +
      total.toString().padEnd(8) + ' | ' +
      indexed.toString().padEnd(8) + ' | ' +
      statusDisplay.padEnd(12) + ' | ' +
      progressDisplay
    );
  });
  
  console.log('='.repeat(80));
  console.log(`Last updated: ${new Date().toLocaleString()}`);
}

// Main monitoring function
async function monitorAndIndex() {
  try {
    const galleries = await getGalleries();
    displayAlbumsTable(galleries);
  } catch (error) {
    console.error('Error in monitoring loop:', error);
  }
}

// Start monitoring
console.log('Starting monitor...');
console.log(`Monitoring ${SERVER_URL} every ${POLL_INTERVAL/1000} seconds`);

// Initial check
monitorAndIndex();

// Set up recurring checks
setInterval(monitorAndIndex, POLL_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down monitor...');
  process.exit(0);
});