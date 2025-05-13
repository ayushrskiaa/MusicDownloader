import React from 'react';

const Header = () => {
    return (
        <header>
            <h1>Spotify Downloader</h1>
            <nav>
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/downloads">Downloads</a></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;