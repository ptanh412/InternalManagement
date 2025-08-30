import { getToken } from "./localStorageService";

/**
 * Download file with proper authentication and filename handling
 */
export const downloadMediaFile = async (mediaUrl, fileName) => {
  try {
    console.log("📁 Starting file download:", fileName);

    // Extract filename from mediaUrl (e.g., from "http://localhost:8888/api/v1/file/media/download/uuid.docx")
    const urlParts = mediaUrl.split('/');
    const fileNameFromUrl = urlParts[urlParts.length - 1]; // Gets the UUID filename

    // Construct the proper download URL using the file service endpoint
    const downloadUrl = `http://localhost:8888/api/v1/file/media/download/${fileNameFromUrl}`;

    console.log("📁 Download URL:", downloadUrl);

    // Fetch the file with authentication
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }

    // Get the file blob
    const blob = await response.blob();

    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download';
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log("📁 File downloaded successfully:", fileName);
    return true;

  } catch (error) {
    console.error('📁 Error downloading file:', error);
    throw new Error(`Failed to download file: ${error.message}`);
  }
};

/**
 * Download file with user feedback
 */
export const downloadMediaFileWithFeedback = async (mediaUrl, fileName) => {
  try {
    await downloadMediaFile(mediaUrl, fileName);
    return { success: true };
  } catch (error) {
    console.error('📁 Download failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to download file. Please try again.'
    };
  }
};
