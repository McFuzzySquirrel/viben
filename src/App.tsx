import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import UploadSong from './components/UploadSong';
import PitchDisplay from './components/PitchDisplay';
import VibrationControl from './components/VibrationControl';
import VoiceInput from './components/VoiceInput';
import PitchSettings from './components/PitchSettings';
import Scores from './components/Scores';
import './styles/App.css'; // Import the CSS file

const App: React.FC = () => {
    const [uploadedSong, setUploadedSong] = useState<File | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [octave, setOctave] = useState<number>(4); // Default octave is 4

    // Base frequencies for one octave
    const baseFrequencies = {
        do: 16.35, // C0
        re: 18.35, // D0
        mi: 20.60, // E0
        fa: 21.83, // F0
        sol: 24.50, // G0
        la: 27.50, // A0
        ti: 30.87, // B0
    };

    const [pitchLevels, setPitchLevels] = useState<{ [key: string]: { min: number, max: number, color: string } }>({
        do: { min: 261.63, max: 277.18, color: 'red' },
        re: { min: 293.66, max: 311.13, color: 'orange' },
        mi: { min: 329.63, max: 349.23, color: 'yellow' },
        fa: { min: 349.23, max: 369.99, color: 'green' },
        sol: { min: 392.00, max: 415.30, color: 'blue' },
        la: { min: 440.00, max: 466.16, color: 'indigo' },
        ti: { min: 493.88, max: 523.25, color: 'violet' },
    });

    useEffect(() => {
        // Update pitchLevels based on the selected octave
        setPitchLevels({
            do: {
                min: baseFrequencies.do * Math.pow(2, octave),
                max: baseFrequencies.do * Math.pow(2, octave + 1 / 12),
                color: 'red',
            },
            re: {
                min: baseFrequencies.re * Math.pow(2, octave),
                max: baseFrequencies.re * Math.pow(2, octave + 1 / 12),
                color: 'orange',
            },
            mi: {
                min: baseFrequencies.mi * Math.pow(2, octave),
                max: baseFrequencies.mi * Math.pow(2, octave + 1 / 12),
                color: 'yellow',
            },
            fa: {
                min: baseFrequencies.fa * Math.pow(2, octave),
                max: baseFrequencies.fa * Math.pow(2, octave + 1 / 12),
                color: 'green',
            },
            sol: {
                min: baseFrequencies.sol * Math.pow(2, octave),
                max: baseFrequencies.sol * Math.pow(2, octave + 1 / 12),
                color: 'blue',
            },
            la: {
                min: baseFrequencies.la * Math.pow(2, octave),
                max: baseFrequencies.la * Math.pow(2, octave + 1 / 12),
                color: 'indigo',
            },
            ti: {
                min: baseFrequencies.ti * Math.pow(2, octave),
                max: baseFrequencies.ti * Math.pow(2, octave + 1 / 12),
                color: 'violet',
            },
        });
    }, [octave, setPitchLevels]);

    const [timeSpent, setTimeSpent] = useState<{ [key: string]: number }>({
        do: 0,
        re: 0,
        mi: 0,
        fa: 0,
        sol: 0,
        la: 0,
        ti: 0,
    });
    const [startTime, setStartTime] = useState<number | null>(null);
    const [currentBar, setCurrentBar] = useState<string | null>(null);
    const [sessions, setSessions] = useState<{ name: string, image: string | null, data: { [key: string]: number } }[]>([]);
    const [sessionName, setSessionName] = useState<string>('');
    const [sessionImage, setSessionImage] = useState<string | null>(null);
    const [isListening, setIsListening] = useState<boolean>(false);

    const handleSongUpload = (file: File) => {
        setUploadedSong(file);
        // Additional logic to process the song and trigger vibrations can be added here
    };

    const handleBarChange = (bar: string) => {
        setCurrentBar(prevBar => {
            if (prevBar !== bar) {
                const currentTime = Date.now();
                if (prevBar) {
                    const timeSpentOnBar = currentTime - (startTime || currentTime);
                    setTimeSpent(prev => ({
                        ...prev,
                        [prevBar]: prev[prevBar] + timeSpentOnBar,
                    }));
                }
                setStartTime(currentTime);
                return bar;
            }
            return prevBar;
        });
    };

    const handleEndSession = () => {
        if (currentBar) {
            const endTime = Date.now();
            const timeSpentOnBar = endTime - (startTime || endTime);
            setTimeSpent(prev => ({
                ...prev,
                [currentBar]: prev[currentBar] + timeSpentOnBar,
            }));
        }
        setSessions(prev => [...prev, { name: sessionName, image: sessionImage, data: timeSpent }]);
        setTimeSpent({
            do: 0,
            re: 0,
            mi: 0,
            fa: 0,
            sol: 0,
            la: 0,
            ti: 0,
        });
        setCurrentBar(null);
        setStartTime(null);
        setSessionName('');
        setSessionImage(null);
        setIsListening(false); // Stop listening
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSessionImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStartSession = () => {
        if (!sessionName) {
            alert('Please enter a session name before starting.');
            return;
        }
        // Reset timeSpent, currentBar, startTime
        setTimeSpent({
            do: 0,
            re: 0,
            mi: 0,
            fa: 0,
            sol: 0,
            la: 0,
            ti: 0,
        });
        setCurrentBar(null);
        setStartTime(null);
        setIsListening(true);
    };

    const clearSessions = () => {
        setSessions([]);
    };

    return (
        <Router>
            <div className="app-container">
                <div className="app">
                    <Routes>
                        <Route path="/" element={
                            <div className="start-page">
                                <img src="/viben-logo.png" alt="Viben Logo" className="logo" />
                                <h1>Vib'N</h1>
                                <p>Practice your vibe, see if you can hold a tone.</p>
                                <Link to="/main">
                                    <button>Start</button>
                                </Link>
                            </div>
                        } />
                        <Route path="/main" element={
                            <div className="main-content">
                                <div className="left-column">
                                    <UploadSong onUpload={handleSongUpload} />
                                    {/* Show VibrationControl only if a song is uploaded */}
                                    {uploadedSong && <VibrationControl song={uploadedSong} />}
                                    <VoiceInput pitchLevels={pitchLevels} onBarChange={handleBarChange} isListening={isListening} stopListening={() => setIsListening(false)} />
                                </div>
                                <div className="right-column">
                                    <button className="settings-button" onClick={() => setShowSettings(!showSettings)}>
                                        {showSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                                    </button>
                                    {showSettings && <PitchSettings pitchLevels={pitchLevels} setPitchLevels={setPitchLevels} octave={octave} setOctave={setOctave} />}
                                    <PitchDisplay pitchLevels={pitchLevels} />
                                    <input
                                        type="text"
                                        value={sessionName}
                                        onChange={(e) => setSessionName(e.target.value)}
                                        placeholder="Enter session name"
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                    <button onClick={handleStartSession} disabled={!sessionName}>Begin</button>
                                    <button onClick={handleEndSession}>End</button>
                                    <Link to="/scores">
                                        <button>See Scores</button>
                                    </Link>
                                    <Link to="/">
                                        <button>Welcome Screen</button>
                                    </Link>
                                </div>
                            </div>
                        } />
                        <Route path="/scores" element={
                            <div>
                                <Scores sessions={sessions} pitchLevels={pitchLevels} clearSessions={clearSessions} />
                                <Link to="/">
                                    <button>Welcome Screen</button>
                                </Link>
                            </div>
                        } />
                    </Routes>
                </div>
            </div>
        </Router>
    );
};

export default App;