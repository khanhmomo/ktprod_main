// Utility function to get full-size image URL for downloads
export function getFullSizeImageUrl(fileId: string, baseUrl: string = ''): string {
  return `${baseUrl}/api/drive/image?id=${fileId}&download=true`;
}

// Utility function to get medium-sized image URL for browsing
export function getMediumImageUrl(fileId: string, baseUrl: string = ''): string {
  return `${baseUrl}/api/drive/image?id=${fileId}&size=medium`;
}

// Utility function to get small thumbnail URL
export function getSmallImageUrl(fileId: string, baseUrl: string = ''): string {
  return `${baseUrl}/api/drive/image?id=${fileId}&size=small`;
}
