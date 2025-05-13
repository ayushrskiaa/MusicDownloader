/**
 * YouTube utility functions
 */

/**
 * Score a YouTube search result for relevance to the track
 * @param {object} video - YouTube search result
 * @param {object} trackInfo - Spotify track info
 * @returns {number} - Score (lower is better)
 */
const scoreVideo = (video, trackInfo) => {
  let score = 0;
  
  // Check if title contains track title
  if (!video.title.toLowerCase().includes(trackInfo.title.toLowerCase())) {
    score += 10;
  }
  
  // Check if title contains artist name
  if (!video.title.toLowerCase().includes(trackInfo.primaryArtist.toLowerCase())) {
    score += 8;
  }
  
  // Prefer videos with "audio" or "official" keywords
  if (!video.title.toLowerCase().includes('audio') && 
      !video.title.toLowerCase().includes('official') &&
      !video.title.toLowerCase().includes('lyric')) {
    score += 5;
  }
  
  // Penalize very long videos (might be compilations)
  const durationParts = video.duration ? video.duration.split(':') : ['0', '0'];
  const durationSeconds = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
  const trackDurationSeconds = trackInfo.duration / 1000;
  
  // If the video is more than 30 seconds longer than the track
  if (durationSeconds > trackDurationSeconds + 30) {
    score += Math.min(10, (durationSeconds - trackDurationSeconds) / 10);
  }
  
  // Prefer videos from official artist channels
  if (video.author?.name && !video.author.name.toLowerCase().includes(trackInfo.primaryArtist.toLowerCase())) {
    score += 3;
  }
  
  return score;
};

/**
 * Filter and sort YouTube search results to find the best match
 * @param {Array} videos - YouTube search results
 * @param {object} trackInfo - Spotify track info
 * @returns {object|null} - Best matching video or null if none found
 */
const findBestMatch = (videos, trackInfo) => {
  if (!videos || videos.length === 0) {
    return null;
  }
  
  // Score each video
  const scoredVideos = videos.map(video => ({
    ...video,
    score: scoreVideo(video, trackInfo)
  }));
  
  // Sort by score (ascending)
  scoredVideos.sort((a, b) => a.score - b.score);
  
  return scoredVideos[0];
};

module.exports = {
  scoreVideo,
  findBestMatch
};