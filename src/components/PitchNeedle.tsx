import React from 'react';

interface PitchNeedleProps {
    pitch: number | null;
    pitchLevels: { [key: string]: { min: number, max: number, color: string } };
}

const PitchNeedle: React.FC<PitchNeedleProps> = ({ pitch, pitchLevels }) => {
    const getColor = (pitch: number | null) => {
        if (!pitch) return 'gray';
        for (const { min, max, color } of Object.values(pitchLevels)) {
            if (pitch >= min && pitch <= max) {
                return color;
            }
        }
        return 'gray';
    };

    const needleStyle = {
        transform: `rotate(${pitch ? (pitch / 1000) * 180 : 0}deg)`,
        backgroundColor: getColor(pitch),
        transition: 'transform 0.1s ease-in-out', // Smooth transition
    };

    return (
        <div className="pitch-needle-container">
            <div className="pitch-needle" style={needleStyle}></div>
        </div>
    );
};

export default PitchNeedle;