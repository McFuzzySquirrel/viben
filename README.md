# Vib'N

Vib'N is an app that allows users to practice holding musical notes and track their progress over multiple sessions. Users can compete with each other to see who can hold notes the longest.

## Features

- **Voice Input**: Detect and display the pitch of the user's voice in real-time.
- **Session Tracking**: Track multiple sessions to observe improvement over time.
- **Competition Mode**: Users can compete to see who can hold notes the longest.
- **Pitch Visualization**: Visualize pitches with bars and a pitch needle.
- **Session Statistics**: View detailed statistics for each session.

*Note: The **Upload Song** feature is currently under development.*

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