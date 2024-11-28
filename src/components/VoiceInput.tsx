import React, { useEffect, useState } from 'react';
import PitchNeedle from './PitchNeedle';
import PitchDetector from 'pitchfinder';
import PitchBars from './PitchBars';

interface VoiceInputProps {
    pitchLevels: { [key: string]: { min: number, max: number, color: string } };
}

const VoiceInput: React.FC<VoiceInputProps> = ({ pitchLevels }) => {
    const [pitch, setPitch] = useState<number | null>(null);
    const [pitchStates, setPitchStates] = useState<{ [key: string]: { isActive: boolean; duration: number } }>(() => {
        const initialStates: { [key: string]: { isActive: boolean; duration: number } } = {};
        Object.keys(pitchLevels).forEach(pitch => {
            initialStates[pitch] = { isActive: false, duration: 0 };
        });
        return initialStates;
    });

    const handleReset = () => {
        setPitchStates(prevStates => {
            const resetStates = { ...prevStates };
            Object.keys(resetStates).forEach(pitchName => {
                resetStates[pitchName].isActive = false;
                resetStates[pitchName].duration = 0;
            });
            return resetStates;
        });
    };

    useEffect(() => {
        const getMicrophoneInput = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            const detector = PitchDetector.YIN();
            const dataArray = new Float32Array(analyser.fftSize);

            const detectPitch = () => {
                analyser.getFloatTimeDomainData(dataArray);
                const pitch = detector(dataArray);
                if (pitch && pitch >= 85 && pitch <= 1100) {
                    setPitch(pitch);
                    let matchedPitch: string | null = null;
                    Object.entries(pitchLevels).forEach(([pitchName, { min, max }]) => {
                        if (pitch >= min && pitch <= max) {
                            matchedPitch = pitchName;
                        }
                    });

                    setPitchStates(prevStates => {
                        const newStates = { ...prevStates };
                        Object.keys(newStates).forEach(pitchName => {
                            if (pitchName === matchedPitch) {
                                newStates[pitchName].isActive = true;
                                newStates[pitchName].duration += 1 / 60; // Approximate frame duration
                            } else {
                                newStates[pitchName].isActive = false;
                                newStates[pitchName].duration = 0;
                            }
                        });
                        return newStates;
                    });
                } else {
                    setPitch(null);
                    setPitchStates(prevStates => {
                        const newStates = { ...prevStates };
                        Object.keys(newStates).forEach(pitchName => {
                            newStates[pitchName].isActive = false;
                            newStates[pitchName].duration = 0;
                        });
                        return newStates;
                    });
                }
                requestAnimationFrame(detectPitch);
            };

            detectPitch();
        };

        getMicrophoneInput();
    }, [pitchLevels]);

    return (
        <div className="voice-input">
            <h2>Voice Input</h2>
            <p>Detected Pitch: {pitch ? `${pitch.toFixed(2)} Hz` : 'No pitch detected'}</p>
            <PitchNeedle pitch={pitch} pitchLevels={pitchLevels} />
            <PitchBars pitchLevels={pitchLevels} pitchStates={pitchStates} />
            <button onClick={handleReset}>Reset</button>
        </div>
    );
};

export default VoiceInput;