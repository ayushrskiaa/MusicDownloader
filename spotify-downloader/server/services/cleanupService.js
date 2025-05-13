const fs = require('fs');
const path = require('path');
const config = require('../config/default');

class CleanupService {
  static async cleanupTempFiles() {
    const tempDir = path.join(__dirname, '..', config.paths.temp);
    const outputDir = path.join(__dirname, '..', config.paths.output);
    const zipDir = path.join(__dirname, '..', config.paths.zip);

    try {
      await this.cleanDirectory(tempDir, 1); // 1 hour
      await this.cleanDirectory(outputDir, 24); // 24 hours
      await this.cleanDirectory(zipDir, config.download.zipExpiry);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  static async cleanDirectory(directory, maxAgeHours) {
    if (!fs.existsSync(directory)) return;

    const files = fs.readdirSync(directory);
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

module.exports = CleanupService;