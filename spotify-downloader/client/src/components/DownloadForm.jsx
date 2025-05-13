import React, { useState } from 'react';

const DownloadForm = () => {
    const [url, setUrl] = useState('');
    const [quality, setQuality] = useState('high');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle the download logic here
        console.log(`Downloading from: ${url} with quality: ${quality}`);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="url">Track URL:</label>
                <input
                    type="text"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="quality">Quality:</label>
                <select
                    id="quality"
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>
            <button type="submit">Download</button>
        </form>
    );
};

export default DownloadForm;