import React, { useEffect, useState, useRef } from 'react';
import PitchNeedle from './PitchNeedle';
import PitchDetector from 'pitchfinder';
import PitchBars from './PitchBars';

interface VoiceInputProps {
    pitchLevels: { [key: string]: { min: number, max: number, color: string } };
    onBarChange: (bar: string) => void;
    isListening: boolean;
    stopListening: () => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ pitchLevels, onBarChange, isListening, stopListening }) => {
    const [pitch, setPitch] = useState<number | null>(null);
    const [pitchStates, setPitchStates] = useState<{ [key: string]: { isActive: boolean; duration: number } }>(() => {
        const initialStates: { [key: string]: { isActive: boolean; duration: number } } = {};
        Object.keys(pitchLevels).forEach(pitch => {
            initialStates[pitch] = { isActive: false, duration: 0 };
        });
        return initialStates;
    });

    const pitchRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const handleReset = () => {
        setPitchStates(prevStates => {
            const resetStates = { ...prevStates };
            Object.keys(resetStates).forEach(pitchName => {
                resetStates[pitchName].isActive = false;
                resetStates[pitchName].duration = 0;
            });
            return resetStates;
        });
        setPitch(null);
        pitchRef.current = null;
    };

    useEffect(() => {
        if (!isListening) return;

        const getMicrophoneInput = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            const detectPitch = PitchDetector.YIN();
            const bufferLength = analyser.fftSize;
            const buffer = new Float32Array(bufferLength);

            const updatePitch = () => {
                analyser.getFloatTimeDomainData(buffer);
                const detectedPitch = detectPitch(buffer);
                pitchRef.current = detectedPitch;
                if (detectedPitch) {
                    const activeBar = Object.keys(pitchLevels).find(bar => {
                        const { min, max } = pitchLevels[bar];
                        return detectedPitch >= min && detectedPitch <= max;
                    });
                    if (activeBar) {
                        onBarChange(activeBar);
                        setPitchStates(prevStates => ({
                            ...prevStates,
                            [activeBar]: {
                                isActive: true,
                                duration: prevStates[activeBar].duration + 1 / 60, // Increment duration more gradually
                            },
                        }));
                    }
                }
                requestAnimationFrame(updatePitch);
            };

            updatePitch();

            return () => {
                stream.getTracks().forEach(track => track.stop());
            };
        };

        getMicrophoneInput();
    }, [isListening, pitchLevels, onBarChange]);

    useEffect(() => {
        if (!isListening && streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, [isListening]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (pitchRef.current !== pitch) {
                setPitch(pitchRef.current);
            }
        }, 1000 / 60); // Update 60 times per second

        return () => clearInterval(interval);
    }, [pitch]);

    return (
        <div>
            <h2>Voice Input</h2>
            <PitchNeedle pitch={pitch} pitchLevels={pitchLevels} />
            <PitchBars pitchLevels={pitchLevels} pitchStates={pitchStates} />
            <button onClick={handleReset}>Reset</button>
        </div>
    );
};

export default VoiceInput;