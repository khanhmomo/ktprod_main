/**
 * Extracts the file ID from a Google Drive URL
 * Supports various Google Drive URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/uc?export=view&id=FILE_ID
 * - https://docs.google.com/document/d/FILE_ID/edit
 * - https://drive.google.com/open?id=FILE_ID
 */
export function extractFileId(url: string): string | null {
  // Handle direct file links
  const fileMatch = url.match(/\/file\/d\/([\w-]+)/);
  if (fileMatch) return fileMatch[1];

  // Handle uc?export=view links
  const ucMatch = url.match(/[&?]id=([\w-]+)/);
  if (ucMatch) return ucMatch[1];

  // Handle open?id= links
  const openMatch = url.match(/[&?]id=([\w-]+)/);
  if (openMatch) return openMatch[1];

  // Handle document links
  const docMatch = url.match(/\/document\/d\/([\w-]+)/);
  if (docMatch) return docMatch[1];

  return null;
}

/**
 * Converts a Google Drive URL to a direct image URL
 * @param url Original Google Drive URL
 * @returns Direct image URL or null if conversion fails
 */
export function getDirectImageUrl(url: string): string | null {
  const fileId = extractFileId(url);
  if (!fileId) return null;
  
  // Return direct image URL for image files
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Checks if a URL is a Google Drive URL
 */
export function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com') || url.includes('docs.google.com');
}
