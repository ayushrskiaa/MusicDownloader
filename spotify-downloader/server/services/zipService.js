const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');

// Directory for ZIP files
const ZIP_DIR = path.join(__dirname, '../downloads/zip');

// Create directory if it doesn't exist
if (!fs.existsSync(ZIP_DIR)) {
  fs.mkdirSync(ZIP_DIR, { recursive: true });
}

/**
 * Create a ZIP file containing multiple MP3 files
 * @param {string[]} filePaths - Array of file paths to include in the ZIP
 * @param {string} zipName - Name for the ZIP file (without extension)
 * @returns {Promise<string>} - Path to the created ZIP file
 */
const createZipFile = async (filePaths, zipName) => {
  // Generate a unique name for the ZIP file
  const uniqueId = uuidv4().substring(0, 8);
  const safeZipName = zipName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const zipFileName = `${safeZipName}-${uniqueId}.zip`;
  const zipFilePath = path.join(ZIP_DIR, zipFileName);
  
  return new Promise((resolve, reject) => {
    // Create a file to write the zip data to
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 5 } // Compression level (1-9)
    });
    
    // Listen for errors
    output.on('error', (err) => {
      reject(err);
    });
    
    // When the zip is finalized, resolve with the path
    output.on('close', () => {
      resolve(zipFilePath);
    });
    
    // Pipe archive data to the file
    archive.pipe(output);
    
    // Add each file to the archive
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        // Use just the filename as the entry name in the zip
        const fileName = path.basename(filePath);
        archive.file(filePath, { name: fileName });
      }
    }
    
    // Finalize the archive
    archive.finalize();
  });
};

/**
 * Clean up old ZIP files
 * @param {number} maxAgeHours - Maximum age in hours for ZIP files to keep
 */
const cleanupOldZipFiles = (maxAgeHours = 24) => {
  try {
    const files = fs.readdirSync(ZIP_DIR);
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(ZIP_DIR, file);
      const stats = fs.statSync(filePath);
      
      // If the file is older than the maximum age, delete it
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old ZIP file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old ZIP files:', error);
  }
};

// Run cleanup every hour
setInterval(cleanupOldZipFiles, 60 * 60 * 1000);
// Also run once on startup
cleanupOldZipFiles();

module.exports = {
  createZipFile
};