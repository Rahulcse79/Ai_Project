import React, { useState, useRef, useEffect } from "react";
import MicRecorder from "mic-recorder-to-mp3";
import "./SpeechToSpeech.css";

const recorder = new MicRecorder({ bitRate: 128 });

const SpeechToSpeech = () => {
  const [recording, setRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null); // Latest user recording
  const [chatHistory, setChatHistory] = useState([]);
  const playingAudio = useRef(null);

  // Stop currently playing audio
  const stopCurrentAudio = () => {
    if (playingAudio.current) {
      playingAudio.current.pause();
      playingAudio.current.currentTime = 0;
      playingAudio.current = null;
    }
  };

  // Start recording
  const startRecording = async () => {
    stopCurrentAudio();
    try {
      await recorder.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      alert("Mic access denied or error");
    }
  };

  // Stop recording
  const stopRecording = async () => {
    stopCurrentAudio();
    try {
      const [buffer, blob] = await recorder.stop().getMp3();
      const file = new File([blob], "sample.mp3", { type: "audio/mp3" });
      setAudioFile(file);
      setRecording(false);

      // Optionally, auto-play user recording
      // replayLastRecording();

      // Send to API for transcription and TTS
      handleApiCall(file);
    } catch (err) {
      console.error(err);
      alert("Recording failed");
      setRecording(false);
    }
  };

  // Replay the latest user recording
  const replayLastRecording = () => {
    if (!audioFile) return alert("No recording to play");

    stopCurrentAudio();

    const audioURL = URL.createObjectURL(audioFile);
    const audioEl = new Audio(audioURL);
    playingAudio.current = audioEl;

    audioEl.play();
    audioEl.onended = () => {
      playingAudio.current = null;
      URL.revokeObjectURL(audioURL); // clean up
    };
  };

  // Call your backend API
  const handleApiCall = async (file) => {
    if (!file) return;

    stopCurrentAudio();

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const res = await fetch("http://192.168.100.11:5000/api/speechTospeech", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      // Add user transcription to chat
      if (data.transcription) {
        setChatHistory((prev) => [
          ...prev,
          { type: "user", text: data.transcription },
        ]);
      }

      // Add AI response and TTS audio
      if (data.ttsFile && data.ttsFile.data) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.ttsFile.data), (c) => c.charCodeAt(0))],
          { type: data.ttsFile.type }
        );
        const audioURL = URL.createObjectURL(audioBlob);

        setChatHistory((prev) => [
          ...prev,
          { type: "ai", text: data.aiReply, audioURL, blob: audioBlob },
        ]);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to process file");
    }
  };

  // Auto-play AI audio whenever chatHistory updates
  useEffect(() => {
    if (chatHistory.length === 0) return;

    const lastEntry = chatHistory[chatHistory.length - 1];
    if (lastEntry.type === "ai" && lastEntry.audioURL) {
      stopCurrentAudio();
      const audioEl = new Audio(lastEntry.audioURL);
      playingAudio.current = audioEl;
      audioEl.play();
      audioEl.onended = () => {
        playingAudio.current = null;
        // Optionally clean up AI audio URLs after playback
        // URL.revokeObjectURL(lastEntry.audioURL);
      };
    }
  }, [chatHistory]);

  // Handle manual audio play (from audio controls)
  const handleAudioPlay = (audioEl) => {
    stopCurrentAudio();
    playingAudio.current = audioEl;
    audioEl.onended = () => (playingAudio.current = null);
  };

  return (
    <div className="sts-container">
      <h2>Speech-to-Speech Chat AI</h2>

      <div className="sts-form">
        {!recording ? (
          <button onClick={startRecording} className="sts-record-btn">
            🎤 Start Recording
          </button>
        ) : (
          <button onClick={stopRecording} className="sts-stop-btn">
            ⏹ Stop Recording
          </button>
        )}

        <button onClick={replayLastRecording} className="sts-replay-btn">
          🔊 Play Last Recording
        </button>
      </div>

      <div className="sts-chat-container">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`sts-chat-bubble ${
              msg.type === "user" ? "sts-user" : "sts-ai"
            }`}
          >
            <p>{msg.text}</p>
            {msg.type === "ai" && msg.audioURL && (
              <audio
                controls
                src={msg.audioURL}
                onPlay={(e) => handleAudioPlay(e.target)}
              ></audio>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpeechToSpeech;
