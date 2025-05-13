require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const spotifyRoutes = require('./routes/spotifyRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const errorHandler = require('./middleware/errorHandler');
const CleanupService = require('./services/cleanupService');
const { createRequiredDirectories } = require('./utils/fileUtils');
const { initializeDirectories } = require('./utils/fileUtils');

initializeDirectories();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Global socket.io access
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the downloads directory
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Set up routes
app.use('/api/spotify', spotifyRoutes);
app.use('/api/download', downloadRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    // Initial cleanup
    CleanupService.cleanupTempFiles();
    // Set interval for future cleanups
    setInterval(CleanupService.cleanupTempFiles, 60 * 60 * 1000);
  })

// Initial cleanup


// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});