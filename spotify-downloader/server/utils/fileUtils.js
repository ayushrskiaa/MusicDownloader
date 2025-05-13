const fs = require('fs');
const path = require('path');
const config = require('../config/default');

/**
 * Ensure directory exists
 * @param {string} dirPath - Path to directory
 */
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Generate a safe filename from track information
 * @param {object} trackInfo - Track information
 * @returns {string} - Safe filename (without extension)
 */
const generateSafeFilename = (trackInfo) => {
  const sanitizedTitle = trackInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const sanitizedArtist = trackInfo.primaryArtist.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  return `${sanitizedArtist}-${sanitizedTitle}`;
};

/**
 * Delete file if it exists
 * @param {string} filePath - Path to file
 * @returns {boolean} - True if file was deleted, false otherwise
 */
const deleteFileIfExists = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
};

/**
 * Clean up old files in a directory
 * @param {string} directory - Directory to clean
 * @param {number} maxAgeHours - Maximum age in hours
 * @returns {number} - Number of files deleted
 */
const cleanupOldFiles = (directory, maxAgeHours) => {
  try {
    if (!fs.existsSync(directory)) {
      return 0;
    }
    
    const files = fs.readdirSync(directory);
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error(`Error cleaning up ${directory}:`, error);
    return 0;
  }
};

const createRequiredDirectories = () => {
  const dirs = [
    path.join(__dirname, '../downloads'),
    path.join(__dirname, '../downloads/temp'),
    path.join(__dirname, '../downloads/output'),
    path.join(__dirname, '../downloads/zip')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize all necessary directories
const initializeDirectories = () => {
  ensureDirectoryExists(path.join(__dirname, '..', config.paths.temp));
  ensureDirectoryExists(path.join(__dirname, '..', config.paths.output));
  ensureDirectoryExists(path.join(__dirname, '..', config.paths.zip));
};

module.exports = {
  ensureDirectoryExists,
  generateSafeFilename,
  deleteFileIfExists,
  cleanupOldFiles,
  initializeDirectories,
  createRequiredDirectories
};