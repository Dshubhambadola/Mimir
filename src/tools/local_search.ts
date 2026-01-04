import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { OllamaEmbeddings } from "@langchain/ollama";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import path from "path";
import fs from "fs";

// Initialize the vector store loader
const getVectorStore = async () => {
    const dbDir = path.resolve(process.cwd(), "data", "vector_store");
    if (!fs.existsSync(dbDir)) {
        throw new Error("Vector store not found. Run 'npm run ingest <dir>' first.");
    }

    const embeddings = new OllamaEmbeddings({
        model: "llama3",
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    });

    return await HNSWLib.load(dbDir, embeddings);
};

export const localSearchTool = tool(
    async ({ query }) => {
        try {
            const vectorStore = await getVectorStore();
            const results = await vectorStore.similaritySearch(query, 3);
            return JSON.stringify(results.map(r => ({
                content: r.pageContent,
                source: r.metadata.source
            })));
        } catch (error: any) {
            return `Error searching codebase: ${error.message}`;
        }
    },
    {
        name: "local_codebase_search",
        description: "Search the local private codebase for code snippets, architecture, or documentation. Use this when the user asks about the project structure or specific files.",
        schema: z.object({
            query: z.string().describe("The search query for the codebase"),
        }),
    }
);
