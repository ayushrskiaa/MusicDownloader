import React from 'react';

const TrackItem = ({ track }) => {
    return (
        <div className="track-item">
            <h3>{track.title}</h3>
            <p>{track.artist}</p>
            <p>{track.album}</p>
            <button>Download</button>
        </div>
    );
};

export default TrackItem;