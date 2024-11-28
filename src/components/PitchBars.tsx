import React from 'react';

interface PitchBarsProps {
    pitchLevels: {
        [key: string]: { min: number; max: number; color: string };
    };
    pitchStates: {
        [key: string]: { isActive: boolean; duration: number };
    };
}

const MAX_DURATION = 5; // Maximum duration in seconds for the bar to fill completely

const PitchBars: React.FC<PitchBarsProps> = ({ pitchLevels, pitchStates }) => {
    return (
        <div className="pitch-bars">
            {Object.keys(pitchLevels).map(pitchName => {
                const { color } = pitchLevels[pitchName];
                const { duration } = pitchStates[pitchName];

                const barWidth = Math.min((duration / MAX_DURATION) * 100, 100);

                const barStyle = {
                    width: `${barWidth}%`,
                    backgroundColor: color,
                    transition: 'width 0.1s ease-in-out',
                };

                return (
                    <div key={pitchName} className="pitch-bar-container">
                        <div className="pitch-bar-label">{pitchName.toUpperCase()}</div>
                        <div className="pitch-bar">
                            <div className="pitch-bar-fill" style={barStyle}></div>
                        </div>
                        <div className="pitch-bar-duration">
                            {`Time: ${duration.toFixed(2)}s`}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PitchBars;