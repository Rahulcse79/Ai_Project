import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Components/ChatGPT";
import SpeechToSpeech from "./Components/SpeechToSpeech";

function App() {
  // document.body.style.backgroundColor = "#000";

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/chat" element={<Home />} />
          <Route path="/" element={<SpeechToSpeech />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
