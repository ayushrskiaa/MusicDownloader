import React, { createContext, useState } from 'react';

export const DownloadContext = createContext();

export const DownloadProvider = ({ children }) => {
    const [downloads, setDownloads] = useState([]);

    const addDownload = (download) => {
        setDownloads((prevDownloads) => [...prevDownloads, download]);
    };

    const removeDownload = (id) => {
        setDownloads((prevDownloads) => prevDownloads.filter(download => download.id !== id));
    };

    return (
        <DownloadContext.Provider value={{ downloads, addDownload, removeDownload }}>
            {children}
        </DownloadContext.Provider>
    );
};