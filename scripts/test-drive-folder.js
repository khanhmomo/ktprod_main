import { getAuthClient } from '../lib/google/credentials';
import { google } from 'googleapis';

async function testDriveFolder(folderId) {
  try {
    // Get authenticated client
    const auth = await getAuthClient();
    const drive = google.drive({ version: 'v3', auth });

    console.log('Testing access to folder:', folderId);
    
    // Test getting folder info
    const folderInfo = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType, webViewLink, capabilities',
    });
    
    console.log('Folder Info:', {
      id: folderInfo.data.id,
      name: folderInfo.data.name,
      url: folderInfo.data.webViewLink,
      canEdit: folderInfo.data.capabilities?.canEdit,
      canListChildren: folderInfo.data.capabilities?.canListChildren,
    });

    // Test listing folder contents
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize: 10,
      fields: 'files(id, name, mimeType, webContentLink, webViewLink)',
    });

    console.log('\nFolder Contents:');
    const files = res.data.files || [];
    if (files.length === 0) {
      console.log('No files found in folder.');
    } else {
      files.forEach(file => {
        console.log(`- ${file.name} (${file.mimeType})`);
        console.log(`  ID: ${file.id}`);
        console.log(`  View: ${file.webViewLink}`);
        if (file.webContentLink) {
          console.log(`  Download: ${file.webContentLink}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error testing Drive folder access:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Extract folder ID from URL
const folderUrl = 'https://drive.google.com/drive/folders/1Q5VZybNM3Hm_Du41Xa21W1WSylNd2uyu?usp=sharing';
// Extract folder ID using a more robust regex
const match = folderUrl.match(/[\/&?](?:id=|folders\/)([\w-]+)/);
const folderId = match ? match[1] : folderUrl.split('/').pop().split('?')[0];

console.log('Extracted folder ID:', folderId);

if (!folderId) {
  console.error('Could not extract folder ID from URL');
  process.exit(1);
}

testDriveFolder(folderId);
