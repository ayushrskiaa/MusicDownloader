import React from 'react';

function TrackList({ tracks = [] }) {
  // Ensure tracks is always an array
  if (!Array.isArray(tracks)) {
    tracks = [];
  }

  return (
    <div>
      {tracks.map(track => (
        <div key={track.id}>
          <p>{track.name}</p>
        </div>
      ))}
    </div>
  );
}

const tracksArray = [
  { id: 1, name: 'Track 1' },
  { id: 2, name: 'Track 2' },
];

export default function App() {
  return <TrackList tracks={tracksArray} />;
}