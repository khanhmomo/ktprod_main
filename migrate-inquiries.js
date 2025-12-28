const mongoose = require('mongoose');
const Inquiry = require('./models/Inquiry');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thewildstudio', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateInquiries() {
  try {
    console.log('Starting migration...');
    
    // Update all inquiries that don't have a source field
    const result = await Inquiry.updateMany(
      { source: { $exists: false } },
      { 
        $set: { 
          source: 'email' // Default to email for existing inquiries
        }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} inquiries with default source field`);
    
    // Update the live chat inquiry specifically
    const liveChatResult = await Inquiry.updateOne(
      { caseId: 'INQ-MJPWH0K8-IELUNH' },
      { 
        $set: { 
          source: 'live_chat'
        }
      }
    );
    
    console.log(`Updated live chat inquiry: ${liveChatResult.modifiedCount} document(s)`);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

migrateInquiries();
