import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DownloadForm from '../components/DownloadForm';
import TrackList from '../components/TrackList';

const Home = () => {
    return (
        <div>
            <Header />
            <main>
                <h1>Welcome to Spotify Downloader</h1>
                <DownloadForm />
                <TrackList />
            </main>
            <Footer />
        </div>
    );
};

export default Home;