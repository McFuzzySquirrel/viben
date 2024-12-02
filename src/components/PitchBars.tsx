import React from 'react';

interface PitchBarsProps {
    pitchLevels: { [key: string]: { min: number, max: number, color: string } };
    pitchStates: { [key: string]: { isActive: boolean; duration: number } };
}

const PitchBars: React.FC<PitchBarsProps> = ({ pitchLevels, pitchStates }) => {
    return (
        <div className="pitch-bars">
            {Object.keys(pitchLevels).map(pitch => (
                <div key={pitch} className="pitch-bar">
                    <div
                        className="pitch-bar-fill"
                        style={{
                            width: `${Math.min((pitchStates[pitch].duration / 5) * 100, 100)}%`, // Fill bar based on duration
                            backgroundColor: pitchLevels[pitch].color,
                        }}
                    ></div>
                    <span className="pitch-label">{pitch}</span>
                </div>
            ))}
        </div>
    );
};

export default PitchBars;