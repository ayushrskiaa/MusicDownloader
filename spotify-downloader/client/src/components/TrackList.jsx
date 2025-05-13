import React from 'react';
import TrackItem from './TrackItem';

const TrackList = ({ tracks }) => {
    return (
        <div className="track-list">
            {tracks.map(track => (
                <TrackItem key={track.id} track={track} />
            ))}
        </div>
    );
};

export default TrackList;