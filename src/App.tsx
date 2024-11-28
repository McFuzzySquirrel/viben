import React, { useState } from 'react';
import UploadSong from './components/UploadSong';
import PitchDisplay from './components/PitchDisplay';
import VibrationControl from './components/VibrationControl';
import VoiceInput from './components/VoiceInput';
import PitchSettings from './components/PitchSettings';
import './styles/App.css'; // Import the CSS file

const App: React.FC = () => {
    const [uploadedSong, setUploadedSong] = useState<File | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [pitchLevels, setPitchLevels] = useState<{ [key: string]: { min: number, max: number, color: string } }>({
        do: { min: 261.63, max: 277.18, color: 'red' },
        re: { min: 293.66, max: 311.13, color: 'orange' },
        mi: { min: 329.63, max: 349.23, color: 'yellow' },
        fa: { min: 349.23, max: 369.99, color: 'green' },
        sol: { min: 392.00, max: 415.30, color: 'blue' },
        la: { min: 440.00, max: 466.16, color: 'indigo' },
        ti: { min: 493.88, max: 523.25, color: 'violet' },
    });

    const handleSongUpload = (file: File) => {
        setUploadedSong(file);
        // Additional logic to process the song and trigger vibrations can be added here
    };

    return (
        <div className="app-container">
            <div className="app">
                <img src="viben-logo.png" width={100}/>
                <h1>Viben Pitch Matcher</h1>
                <UploadSong onUpload={handleSongUpload} />
                {/* Show VibrationControl only if a song is uploaded */}
                {uploadedSong && <VibrationControl song={uploadedSong} />}
                <VoiceInput pitchLevels={pitchLevels} />
                <button onClick={() => setShowSettings(!showSettings)}>
                    {showSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                </button>
                {showSettings && <PitchSettings pitchLevels={pitchLevels} setPitchLevels={setPitchLevels} />}
                <PitchDisplay pitchLevels={pitchLevels} />
            </div>
        </div>
    );
};

export default App;