const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TrackSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  primaryArtist: { type: String },
  album: { type: String },
  releaseDate: { type: String },
  albumArt: { type: String },
  duration: { type: Number },
  isrc: { type: String },
  popularity: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'downloading', 'processing', 'completed', 'error'],
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0
  }
});

const DownloadSchema = new Schema({
  type: {
    type: String,
    enum: ['track', 'playlist'],
    required: true
  },
  spotifyId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  tracks: [TrackSchema],
  status: {
    type: String,
    enum: ['pending', 'downloading', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0
  },
  downloadUrl: {
    type: String,
    default: null
  },
  zipPath: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setHours(date.getHours() + 24);
      return date;
    }
  }
});

module.exports = mongoose.model('Download', DownloadSchema);