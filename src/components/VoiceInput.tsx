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

    const [detectedBar, setDetectedBar] = useState<string | null>(null);
    const barChangeRef = useRef<string | null>(null);

    const pitchRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number>();
    const audioContextRef = useRef<AudioContext | null>(null);
    const isListeningRef = useRef(isListening);

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

    // Reset pitch states when isListening becomes true
    useEffect(() => {
        if (isListening) {
            handleReset();
        }
    }, [isListening]);

    // Update the isListeningRef whenever isListening changes
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    useEffect(() => {
        if (!isListening) return;

        const getMicrophoneInput = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            const detectPitch = PitchDetector.YIN();
            const bufferLength = analyser.fftSize;
            const buffer = new Float32Array(bufferLength);

            const updatePitch = () => {
                if (!isListeningRef.current) return; // Use ref instead of state

                analyser.getFloatTimeDomainData(buffer);
                const detectedPitch = detectPitch(buffer);
                pitchRef.current = detectedPitch;

                if (detectedPitch) {
                    setPitch(detectedPitch);

                    const activeBar = Object.keys(pitchLevels).find(bar => {
                        const { min, max } = pitchLevels[bar];
                        return detectedPitch >= min && detectedPitch <= max;
                    });

                    if (activeBar && activeBar !== barChangeRef.current) {
                        setDetectedBar(activeBar);
                        barChangeRef.current = activeBar;
                    }
                } else {
                    if (barChangeRef.current !== null) {
                        setDetectedBar(null);
                        barChangeRef.current = null;
                    }
                    setPitch(null);
                }

                requestRef.current = requestAnimationFrame(updatePitch);
            };

            updatePitch();
        };

        getMicrophoneInput();

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = undefined;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, [isListening, pitchLevels]);

    // Handle bar changes and durations
    useEffect(() => {
        if (detectedBar) {
            onBarChange(detectedBar);
            setPitchStates(prevStates => ({
                ...prevStates,
                [detectedBar]: {
                    isActive: true,
                    duration: prevStates[detectedBar].duration + 1 / 60, // Assuming 60 FPS
                },
            }));
        }
    }, [detectedBar, onBarChange]);

    return (
        <div className="mic-indicator">
            {isListening ? (
                <div className="mic-status">&#127908; &#128994;</div>
            ) : (
                <div className="mic-status">&#127908; &#128308;</div>
            )}
            <PitchNeedle pitch={pitch} pitchLevels={pitchLevels} />
            <PitchBars pitchLevels={pitchLevels} pitchStates={pitchStates} />
            <button onClick={handleReset}>Reset Pitch Levels</button>
        </div>
    );
};

export default VoiceInput;