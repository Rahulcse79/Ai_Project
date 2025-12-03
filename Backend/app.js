import express from "express";
import cors from "cors";
import groqAiRoutes from "./routes/groqAi.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", groqAiRoutes);

export default app;
