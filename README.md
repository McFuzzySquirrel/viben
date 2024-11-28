# React Vibration App

This project is a React-based web application that allows users to upload a song and receive vibrations based on the beat of the song. It also provides pitch levels for musical notes (Do, Re, Mi, Fa, etc.) to help users match the correct notes.

## Features

- Upload a song file to analyze its beat.
- Vibrations are triggered in sync with the beat of the song.
- Display of expected pitch levels alongside user input for pitch matching.

## Project Structure

```
react-vibration-app
├── public
│   ├── index.html          # Main HTML document
│   └── manifest.json       # Metadata for PWA features
├── src
│   ├── components
│   │   ├── PitchDisplay.tsx  # Displays pitch levels
│   │   ├── UploadSong.tsx    # Handles song uploads
│   │   └── VibrationControl.tsx # Manages vibration settings
│   ├── App.tsx              # Main application component
│   ├── index.tsx            # Entry point for the React app
│   └── styles
│       └── App.css          # CSS styles for the application
├── package.json             # npm configuration file
├── tsconfig.json            # TypeScript configuration file
└── README.md                # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd react-vibration-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Start the development server:
   ```
   npm start
   ```
2. Open your browser and go to `http://localhost:3000`.

3. Upload a song file using the provided interface and start matching the pitch levels.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features.

## License

This project is licensed under the MIT License.