import React from 'react';

interface UploadSongProps {
    onUpload: (file: File) => void;
}

const UploadSong: React.FC<UploadSongProps> = ({ onUpload }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            onUpload(event.target.files[0]);
        }
    };

    return (
        <div className="upload-song">
            <label htmlFor="song-upload">Upload a Song (Optional)</label>
            <input type="file" id="song-upload" onChange={handleFileChange} />
        </div>
    );
};

export default UploadSong;