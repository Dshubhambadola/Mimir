import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";

export const getModel = () => {
  if (process.env.NEXT_PUBLIC_USE_LOCAL_LLM === "true") {
    console.log("Using Local LLM (Ollama)");
    return new ChatOllama({
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: "llama3", // or mistral, parameterize if needed
      temperature: 0,
    });
  }

  return new ChatGoogleGenerativeAI({
    model: "gemini-1.5-pro",
    temperature: 0,
    maxOutputTokens: 8192,
  });
};
