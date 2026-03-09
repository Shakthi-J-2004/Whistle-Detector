Whistle Counter Web App

A real-time whistle detection web application that listens through the microphone, counts whistles, and triggers an alert when a target number of whistles is reached. This project demonstrates Web Audio API, real-time signal processing, and interactive UI design using JavaScript.

🚀 Features

🎤 Real-time whistle detection using microphone input

🔢 Automatic whistle counter

🎯 Custom target limit for whistle count

🔔 Alarm notification when the target is reached

📊 Live audio visualizer

⚙️ Adjustable sensitivity control

📜 Session history tracking

📱 Responsive and modern UI

🔋 Wake Lock support to keep screen active while listening

🧠 How It Works

The application uses the Web Audio API to capture microphone input and analyze frequency data in real time.

The microphone audio stream is processed using an FFT analyser to extract frequency amplitudes. 

audio-engine

Frequencies between 2000Hz and 5000Hz are monitored because whistles typically occur in this range. 

audio-engine

When the amplitude crosses a configurable threshold, the system identifies a whistle. 

audio-engine

Each whistle increments the counter and once the target count is reached, an alarm is triggered. 

app

📂 Project Structure
whistle-counter/
│
├── index.html        # Main UI layout
├── styles.css        # Styling and UI design
├── app.js            # Application controller logic
├── audio-engine.js   # Whistle detection and audio processing
├── ui.js             # UI interactions and visualizer
├── history-manager.js# Session history storage

The AudioEngine handles microphone capture and whistle detection. 

audio-engine

The UI module manages controls, alerts, and visualizer rendering. 

ui

The HistoryManager stores previous sessions in browser local storage. 

history-manager

⚙️ Installation

Clone the repository:

git clone https://github.com/yourusername/whistle-counter.git

Open the project folder:

cd whistle-counter

Run the project by opening:

index.html

in your browser.

⚠️ Note: You must allow microphone access for the app to work.

🖥️ Usage

Open the application in your browser.

Click Start Listening.

Set the target whistle count.

Whistle near the microphone.

When the target is reached, the app triggers an alarm alert.

🛠️ Technologies Used

HTML5

CSS3

JavaScript (ES6 Modules)

Web Audio API

Canvas API

LocalStorage

💡 Possible Improvements

Machine learning based whistle detection

Mobile app version

Sound classification for multiple sound types

Data analytics dashboard for whistle sessions

📜 License

This project is open source and available under the MIT License.
