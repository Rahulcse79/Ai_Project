import express from "express";
import multer from "multer";
import { speechToSpeech, chatWithAIINCHAT } from "../controllers/groqAi.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/chat", chatWithAIINCHAT);
router.post("/speechTospeech", upload.single("audio"), speechToSpeech);

export default router;
