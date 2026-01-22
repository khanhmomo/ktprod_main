// Utility function to get full-size image URL for downloads
export function getFullSizeImageUrl(fileId: string, baseUrl: string = ''): string {
  return `${baseUrl}/api/drive/image?id=${fileId}&download=true`;
}

// Utility function to get high-quality image URL for browsing (2048px max long edge)
export function getHighQualityImageUrl(fileId: string, baseUrl: string = ''): string {
  return `${baseUrl}/api/drive/image?id=${fileId}&size=high`;
}

// Utility function to get small thumbnail URL
export function getSmallImageUrl(fileId: string, baseUrl: string = ''): string {
  return `${baseUrl}/api/drive/image?id=${fileId}&size=small`;
}
