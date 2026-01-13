import { SimpleVectorStore } from "../utils/SimpleVectorStore";
import { OllamaEmbeddings } from "@langchain/ollama";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Simple text splitter function
function splitText(text: string, chunkSize: number = 1000, chunkOverlap: number = 200): string[] {
    const chunks: string[] = [];
    let index = 0;
    while (index < text.length) {
        chunks.push(text.slice(index, index + chunkSize));
        index += chunkSize - chunkOverlap;
    }
    return chunks;
}

// Recursive directory scanner
function getFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== "node_modules" && !file.startsWith(".")) {
                getFiles(filePath, fileList);
            }
        } else {
            if (/\.(ts|tsx|js|md|txt)$/.test(file)) {
                fileList.push(filePath);
            }
        }
    }
    return fileList;
}

async function run() {
    const targetDir = process.argv[2];
    if (!targetDir) {
        console.error("Please provide a directory path to ingest.");
        process.exit(1);
    }

    console.log(`Scanning directory: ${targetDir}`);
    const files = getFiles(path.resolve(targetDir));
    console.log(`Found ${files.length} documents.`);

    const docs = [];
    for (const filePath of files) {
        const content = fs.readFileSync(filePath, "utf-8");
        const chunks = splitText(content);
        for (const chunk of chunks) {
            docs.push({
                pageContent: chunk,
                metadata: { source: filePath }
            });
        }
    }
    console.log(`Created ${docs.length} chunks.`);

    // Embed and store
    console.log("Embedding and storing in SimpleVectorStore...");
    const embeddings = new OllamaEmbeddings({
        model: "llama3", // matching ingest model
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    });

    const vectorStore = new SimpleVectorStore(embeddings);

    const BATCH_SIZE = 50;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = docs.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(docs.length / BATCH_SIZE)}...`);
        await vectorStore.addDocuments(batch);
    }

    // Save to disk by serializing the memory store to JSON
    const dbDir = path.resolve(process.cwd(), "data", "vector_store_json");
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const data = vectorStore.toJSON();
    fs.writeFileSync(path.join(dbDir, "store.json"), data);

    console.log(`Vector store saved to ${dbDir}`);
}

run().catch(console.error);
