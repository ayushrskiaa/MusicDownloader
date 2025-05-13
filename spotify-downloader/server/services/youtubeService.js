const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const NodeID3 = require('node-id3');
const axios = require('axios');

// Make sure the download directories exist
const TEMP_DIR = path.join(__dirname, '../downloads/temp');
const OUTPUT_DIR = path.join(__dirname, '../downloads/output');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Search for a track on YouTube
 * @param {object} trackInfo - Track information from Spotify
 * @returns {string} - YouTube video URL
 */
const findYouTubeVideo = async (trackInfo) => {
  try {
    const searchQuery = `${trackInfo.artist} - ${trackInfo.title} audio`;
    const searchResults = await ytsr(searchQuery, { limit: 5 });
    
    // Filter for videos only and attempt to find best match
    const videos = searchResults.items.filter(item => item.type === 'video');
    
    // Choose the best match based on title similarity and duration
    const bestMatch = videos.reduce((best, current) => {
      // Prefer videos with "official audio" or similar keywords
      const titleMatch = current.title.toLowerCase().includes(trackInfo.title.toLowerCase());
      const artistMatch = current.title.toLowerCase().includes(trackInfo.primaryArtist.toLowerCase());
      const isAudioKeyword = current.title.toLowerCase().includes('audio') || 
                            current.title.toLowerCase().includes('official');
      
      // Calculate duration difference (Spotify duration is in ms, convert to seconds)
      const spotifyDuration = trackInfo.duration / 1000;
      const durationDiff = Math.abs(current.duration.split(':').reduce((acc, time) => (60 * acc) + parseInt(time), 0) - spotifyDuration);
      
      // Score the match (lower is better)
      const currentScore = (titleMatch ? 0 : 10) + 
                          (artistMatch ? 0 : 8) + 
                          (isAudioKeyword ? 0 : 5) + 
                          (durationDiff / 10);
      
      const bestScore = (best.score !== undefined) ? best.score : Infinity;
      
      if (currentScore < bestScore) {
        return { ...current, score: currentScore };
      }
      return best;
    }, {});
    
    if (!bestMatch.url) {
      throw new Error('No suitable YouTube video found');
    }
    
    return bestMatch.url;
  } catch (error) {
    console.error(`Error finding YouTube video for ${trackInfo.title}:`, error);
    throw new Error(`Failed to find YouTube video: ${error.message}`);
  }
};

/**
 * Download and process a track from YouTube
 * @param {object} trackInfo - Track information from Spotify
 * @param {object} options - Additional options
 * @returns {string} - Path to the processed MP3 file
 */
const downloadAndProcessTrack = async (trackInfo, options = {}) => {
  const io = options.io;
  const downloadId = options.downloadId;
  const socketId = options.socketId;
  
  try {
    // Find the YouTube video
    const videoUrl = await findYouTubeVideo(trackInfo);
    
    // Generate safe filenames
    const sanitizedTitle = trackInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const sanitizedArtist = trackInfo.primaryArtist.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${sanitizedArtist}-${sanitizedTitle}`;
    
    const tempFilePath = path.join(TEMP_DIR, `${filename}.webm`);
    const outputFilePath = path.join(OUTPUT_DIR, `${filename}.mp3`);
    
    // Skip if the file already exists
    if (fs.existsSync(outputFilePath)) {
      return outputFilePath;
    }
    
    // Progress tracking
    let previousProgress = 0;
    
    // Download the audio from YouTube
    if (io && socketId) {
      io.to(socketId).emit('download-progress', {
        id: downloadId,
        trackId: trackInfo.id,
        status: 'downloading',
        message: `Downloading ${trackInfo.title}`,
        progress: 0
      });
    }
    
    // Create a write stream for the temporary file
    const writeStream = fs.createWriteStream(tempFilePath);
    
    // Download only audio from YouTube
    const videoInfo = await ytdl.getInfo(videoUrl);
    const audioFormats = ytdl.filterFormats(videoInfo.formats, 'audioonly');
    
    // Get the highest quality audio format
    const format = audioFormats.sort((a, b) => b.audioBitrate - a.audioBitrate)[0];
    
    return new Promise((resolve, reject) => {
      // Download the audio
      const stream = ytdl(videoUrl, { format });
      
      // Track download progress
      stream.on('progress', (_, downloaded, total) => {
        const percent = Math.round((downloaded / total) * 50); // First 50% is download
        
        if (percent > previousProgress + 5) {
          previousProgress = percent;
          
          if (io && socketId) {
            io.to(socketId).emit('download-progress', {
              id: downloadId,
              trackId: trackInfo.id,
              status: 'downloading',
              message: `Downloading ${trackInfo.title}`,
              progress: percent
            });
          }
        }
      });
      
      // Pipe the stream to the file
      stream.pipe(writeStream);
      
      // Handle write stream events
      writeStream.on('finish', async () => {
        try {
          if (io && socketId) {
            io.to(socketId).emit('download-progress', {
              id: downloadId,
              trackId: trackInfo.id,
              status: 'processing',
              message: `Converting ${trackInfo.title}`,
              progress: 50
            });
          }
          
          // Convert to MP3 using ffmpeg
          await new Promise((resolveFfmpeg, rejectFfmpeg) => {
            ffmpeg(tempFilePath)
              .audioBitrate(320)
              .format('mp3')
              .on('progress', (progress) => {
                if (progress.percent) {
                  const totalPercent = 50 + Math.round(progress.percent / 2);
                  
                  if (io && socketId) {
                    io.to(socketId).emit('download-progress', {
                      id: downloadId,
                      trackId: trackInfo.id,
                      status: 'processing',
                      message: `Converting ${trackInfo.title}`,
                      progress: totalPercent
                    });
                  }
                }
              })
              .on('end', () => {
                resolveFfmpeg();
              })
              .on('error', (err) => {
                rejectFfmpeg(err);
              })
              .save(outputFilePath);
          });
          
          // Add metadata and album art
          await addMetadataToMp3(outputFilePath, trackInfo);
          
          if (io && socketId) {
            io.to(socketId).emit('download-progress', {
              id: downloadId,
              trackId: trackInfo.id,
              status: 'completed',
              message: `Downloaded ${trackInfo.title}`,
              progress: 100
            });
          }
          
          // Clean up temporary file
          fs.unlinkSync(tempFilePath);
          
          resolve(outputFilePath);
        } catch (err) {
          reject(err);
        }
      });
      
      writeStream.on('error', (err) => {
        reject(err);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Error downloading track ${trackInfo.title}:`, error);
    
    if (io && socketId) {
      io.to(socketId).emit('download-progress', {
        id: downloadId,
        trackId: trackInfo.id,
        status: 'error',
        message: `Error downloading ${trackInfo.title}: ${error.message}`,
        progress: 0
      });
    }
    
    throw new Error(`Failed to download track: ${error.message}`);
  }
};

/**
 * Add metadata and album art to MP3 file
 * @param {string} filePath - Path to the MP3 file
 * @param {object} trackInfo - Track information from Spotify
 * @returns {Promise<void>}
 */
const addMetadataToMp3 = async (filePath, trackInfo) => {
  try {
    // Download album art if available
    let imageBuffer = null;
    if (trackInfo.albumArt) {
      const response = await axios.get(trackInfo.albumArt, { responseType: 'arraybuffer' });
      imageBuffer = response.data;
    }
    
    // Prepare ID3 tags
    const tags = {
      title: trackInfo.title,
      artist: trackInfo.artist,
      album: trackInfo.album,
      year: trackInfo.releaseDate ? trackInfo.releaseDate.substring(0, 4) : '',
      TRCK: String(trackInfo.trackNumber || ''),
      ISRC: trackInfo.isrc || '',
      comment: {
        language: 'eng',
        text: 'Downloaded with Spotify Downloader'
      }
    };
    
    // Add album art if available
    if (imageBuffer) {
      tags.image = {
        mime: 'image/jpeg',
        type: { id: 3, name: 'front cover' },
        description: 'Album Art',
        imageBuffer
      };
    }
    
    // Write tags to the file
    NodeID3.write(tags, filePath);
  } catch (error) {
    console.error(`Error adding metadata to ${filePath}:`, error);
    // Continue without metadata if there's an error
  }
};

module.exports = {
  findYouTubeVideo,
  downloadAndProcessTrack
};