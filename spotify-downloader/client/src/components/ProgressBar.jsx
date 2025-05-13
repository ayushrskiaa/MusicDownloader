import React from 'react';

const ProgressBar = ({ progress }) => {
    return (
        <div style={{ width: '100%', backgroundColor: '#e0e0df', borderRadius: '5px' }}>
            <div
                style={{
                    height: '20px',
                    width: `${progress}%`,
                    backgroundColor: '#3b5998',
                    borderRadius: '5px',
                    transition: 'width 0.5s ease-in-out'
                }}
            />
        </div>
    );
};

export default ProgressBar;