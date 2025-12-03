import Groq from "groq-sdk";
import dotenv from "dotenv";
import { exec } from "child_process";
import fs from "fs";
import { promisify } from "util";
import gtts from "google-tts-api";
import fetch from "node-fetch";

dotenv.config();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

let chatHistory = [];

const execAsync = promisify(exec);
const whisperBinary =
  process.env.WHISPER_BINARY ||
  "/home/support/whisper.cpp/build/bin/whisper-cli";
const modelPath =
  process.env.WHISPER_MODEL ||
  "/home/support/whisper.cpp/models/ggml-base.en.bin";

const FilePathWav = process.env.FILE_PATH_WAV || "./sample.wav";
const FileName = process.env.FILE_NAME || "sample.mp3";
const FilePath = `./${FileName}`;

async function transcribeMp3(mp3File, wavFile) {
  try {
    console.log(`Converting MP3 to WAV...`);
    await execAsync(`ffmpeg -y -i ${mp3File} ${wavFile}`);
    console.log("Conversion done.");
    console.log("Running Whisper.cpp transcription...");
    const { stdout, stderr } = await execAsync(
      `${whisperBinary} -f ${wavFile} -m ${modelPath}`
    );
    if (stderr) console.warn("Whisper warning:", stderr);
    const transcription = stdout.replace(/\[.*?-->\s*.*?\]/g, "").trim();
    return transcription;
  } catch (err) {
    console.error("Error during transcription:", err);
    throw err;
  }
}

const downloadTTS = async (result) => {
  try {
    const url = gtts.getAudioUrl(result, {
      lang: "en",
      slow: false,
      host: "https://translate.google.com",
    });
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(FileName, Buffer.from(buffer));
    console.log(`Saved MP3 as ${FileName}`);
  } catch (err) {
    console.error("TTS Error:", err);
  }
};

let AiAnswer = async (message) => {
  try {
    chatHistory.push({ role: "user", content: message });
    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: chatHistory,
    });
    const botReply = response.choices[0].message.content;
    chatHistory.push({ role: "assistant", content: botReply });
    return botReply;
  } catch (err) {
    console.error("AI error:", err);
    return "Error: AI model failed.";
  }
};

export const chatWithAIINCHAT = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }
    const botReply = await AiAnswer(message);
    return res.status(200).json({ reply: botReply });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({ error: "AI request failed" });
  }
};

export const speechToSpeech = async (req, res) => {
  console.log("speechToSpeech called...");
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio file required" });
    }
    const fileData = req.file.path;
    console.log("Uploaded Audio File Path:", fileData);
    const message = await transcribeMp3(fileData, FilePathWav);
    console.log("Speech-to-Text:", message);
    const result = await AiAnswer(message);
    console.log("AI Response:", result);
    await downloadTTS(result);
    const audioBase64 = fs.readFileSync(FilePath, { encoding: "base64" });
    return res.status(200).json({
      success: true,
      uploaded: fileData,
      transcription: message,
      aiReply: result,
      ttsFile: {
        data: audioBase64,
        type: "audio/mp3",
        fileName: FileName,
      },
    });
  } catch (err) {
    console.error("speechToSpeech ERROR:", err);
    return res.status(500).json({ error: "Failed to process audio" });
  }
};
