import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface ScoresProps {
    sessions: { name: string, image: string | null, data: { [key: string]: number } }[];
    pitchLevels: { [key: string]: { min: number, max: number, color: string } };
    clearSessions: () => void;
}

const Scores: React.FC<ScoresProps> = ({ sessions, pitchLevels, clearSessions }) => {
    const navigate = useNavigate();

    const handleBackToHome = () => {
        clearSessions();
        navigate('/main');
    };

    const calculateTotalScore = (data: { [key: string]: number }) => {
        return Object.values(data).reduce((total, duration) => total + duration, 0) / 1000; // Convert ms to seconds
    };

    return (
        <div>
            <h1>Overall Comparison</h1>
            <div className="scores-grid">
                {sessions.map((session, index) => (
                    <div key={index} className="session">
                        <h2>{session.name}</h2>
                        {session.image && <img src={session.image} alt={`${session.name}'s session`} className="session-image" />}
                        {Object.keys(pitchLevels).map(bar => (
                            <p key={bar}>{bar}: {session.data[bar]} ms</p>
                        ))}
                        <p>Total Score: {calculateTotalScore(session.data)} seconds</p>
                    </div>
                ))}
            </div>
            <button onClick={handleBackToHome}>Back to Home</button>
        </div>
    );
};

export default Scores;