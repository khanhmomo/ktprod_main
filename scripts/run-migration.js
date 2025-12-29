const https = require('https');

async function runMigration() {
  console.log('🚀 Running face recognition migration via API...');
  
  const options = {
    hostname: 'thewildstudio.org',
    port: 443,
    path: '/api/admin/migrate-face-recognition',
    method: 'POST',
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
          const result = JSON.parse(data);
          console.log('\n📊 Migration Result:');
          console.log('==================');
          console.log(`✅ Success: ${result.success}`);
          console.log(`📝 Message: ${result.message}`);
          console.log(`📈 Updated: ${result.updatedCount} galleries`);
          if (result.remainingCount !== undefined) {
            console.log(`⏳ Remaining: ${result.remainingCount} galleries`);
          }
          console.log('==================');
          
          if (result.success) {
            console.log('🎉 Migration completed successfully!');
          } else {
            console.log('⚠️ Migration completed with warnings');
          }
          
          resolve(result);
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

// Run the migration
runMigration().catch(console.error);
