import React from 'react';

interface VibrationControlProps {
    song: File;
}

const VibrationControl: React.FC<VibrationControlProps> = ({ song }) => {
    return (
        <div className="vibration-control">
            <h2>Vibration Control</h2>
            <p>Song: {song.name}</p>
            {/* Additional logic to control vibrations can be added here */}
        </div>
    );
};

export default VibrationControl;