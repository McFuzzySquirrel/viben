import React, { useState, useEffect } from 'react';

interface PitchSettingsProps {
    pitchLevels: { [key: string]: { min: number, max: number, color: string } };
    setPitchLevels: React.Dispatch<React.SetStateAction<{ [key: string]: { min: number, max: number, color: string } }>>;
}

const PitchSettings: React.FC<PitchSettingsProps> = ({ pitchLevels, setPitchLevels }) => {
    const [localPitchLevels, setLocalPitchLevels] = useState(pitchLevels);

    useEffect(() => {
        setLocalPitchLevels(pitchLevels);
    }, [pitchLevels]);

    const handleChange = (pitch: string, field: string, value: string) => {
        setLocalPitchLevels({
            ...localPitchLevels,
            [pitch]: {
                ...localPitchLevels[pitch],
                [field]: field === 'color' ? value : parseFloat(value),
            },
        });
    };

    const handleSave = () => {
        setPitchLevels(localPitchLevels);
    };

    return (
        <div className="pitch-settings">
            <h2>Pitch Settings</h2>
            {Object.entries(localPitchLevels).map(([pitch, { min, max, color }]) => (
                <div key={pitch}>
                    <h3>{pitch}</h3>
                    <label>
                        Min Frequency:
                        <input
                            type="number"
                            value={min}
                            onChange={(e) => handleChange(pitch, 'min', e.target.value)}
                        />
                    </label>
                    <label>
                        Max Frequency:
                        <input
                            type="number"
                            value={max}
                            onChange={(e) => handleChange(pitch, 'max', e.target.value)}
                        />
                    </label>
                    <label>
                        Color:
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => handleChange(pitch, 'color', e.target.value)}
                        />
                    </label>
                </div>
            ))}
            <button onClick={handleSave}>Save</button>
        </div>
    );
};

export default PitchSettings;