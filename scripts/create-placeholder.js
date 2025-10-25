const fs = require('fs');
const path = require('path');

// Create a simple gradient image
const width = 1920;
const height = 1080;
const canvas = require('canvas').createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Create gradient
const gradient = ctx.createLinearGradient(0, 0, width, height);
gradient.addColorStop(0, '#1a202c');
gradient.addColorStop(1, '#2d3748');

// Fill with gradient
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// Add some text in the center
ctx.fillStyle = '#ffffff';
ctx.font = '48px Arial';
ctx.textAlign = 'center';
ctx.fillText('THE WILD ACADEMY', width / 2, height / 2);

// Save to file
const out = fs.createWriteStream(path.join(__dirname, '../public/images/academy/hero-bg.jpg'));
const stream = canvas.createJPEGStream({
  quality: 0.8,
  chromaSubsampling: false
});

stream.pipe(out);
out.on('finish', () => console.log('Created placeholder image at public/images/academy/hero-bg.jpg'));
