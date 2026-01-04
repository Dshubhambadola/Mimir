import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
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
    console.log("Embedding and storing in HNSWLib...");
    const embeddings = new OllamaEmbeddings({
        model: "llama3", // Ensure you have this pulled in Ollama
        baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    });

    const vectorStore = await HNSWLib.fromDocuments(docs, embeddings);

    const dbDir = path.resolve(process.cwd(), "data", "vector_store");
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    await vectorStore.save(dbDir);
    console.log(`Vector store saved to ${dbDir}`);
}

run().catch(console.error);
