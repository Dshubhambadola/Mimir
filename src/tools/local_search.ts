import { DynamicTool } from "@langchain/core/tools";
import { SimpleVectorStore } from "../utils/SimpleVectorStore";
import { OllamaEmbeddings } from "@langchain/ollama";
import path from "path";
import fs from "fs";

export const local_codebase_search = new DynamicTool({
    name: "local_codebase_search",
    description: "Searches the user's local private codebase for code snippets, error context, or configuration files.",
    func: async (query: string) => {
        try {
            const dbDir = path.resolve(process.cwd(), "data", "vector_store_json");
            const storeFile = path.join(dbDir, "vectors.jsonl");

            if (!fs.existsSync(storeFile)) {
                return "Error: Local vector store not found. Please run 'npm run ingest /path/to/repo' first.";
            }

            console.log("Loading SimpleVectorStore from JSONL...");

            const embeddings = new OllamaEmbeddings({
                model: "llama3", // matching ingest model
                baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
            });

            // Rehydrate the memory store
            const vectorStore = await SimpleVectorStore.load(dbDir, embeddings);

            const results = await vectorStore.similaritySearch(query, 4);

            return results
                .map((res) => `[Source: ${res.metadata.source}]\n${res.pageContent}`)
                .join("\n\n---\n\n");
        } catch (e: any) {
            return `Error querying local codebase: ${e.message}`;
        }
    },
});
