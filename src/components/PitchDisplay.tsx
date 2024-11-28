import React from 'react';

interface PitchDisplayProps {
    pitchLevels: {
        [key: string]: { min: number, max: number, color: string };
    };
}

const PitchDisplay: React.FC<PitchDisplayProps> = ({ pitchLevels }) => {
    return (
        <div className="pitch-display">
            <h2>Pitch Levels</h2>
            <ul>
                {Object.entries(pitchLevels).map(([pitch, { min, max, color }]) => (
                    <li key={pitch} style={{ color }}>
                        {pitch}: {min} Hz - {max} Hz
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PitchDisplay;