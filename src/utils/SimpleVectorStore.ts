import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

interface VectorDoc {
    content: string;
    metadata: Record<string, any>;
    embedding: number[];
}

export class SimpleVectorStore {
    vectors: VectorDoc[] = [];

    constructor(private embeddings: Embeddings) { }

    async addDocuments(docs: Document[]) {
        const texts = docs.map(d => d.pageContent);
        const embeddings = await this.embeddings.embedDocuments(texts);

        docs.forEach((doc, i) => {
            this.vectors.push({
                content: doc.pageContent,
                metadata: doc.metadata,
                embedding: embeddings[i]
            });
        });
    }

    async similaritySearch(query: string, k: number = 4) {
        const queryEmbedding = await this.embeddings.embedQuery(query);

        // Calculate cosine similarity
        const results = this.vectors.map(doc => {
            const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
            return { doc, similarity };
        });

        // Sort descending
        results.sort((a, b) => b.similarity - a.similarity);

        // Return top k
        return results.slice(0, k).map(r => new Document({
            pageContent: r.doc.content,
            metadata: r.doc.metadata
        }));
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // New scalable save method (JSONL)
    async save(directory: string): Promise<void> {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }
        const filePath = path.join(directory, "vectors.jsonl");
        const stream = fs.createWriteStream(filePath, { flags: 'w' });

        for (const doc of this.vectors) {
            const line = JSON.stringify(doc) + "\n";
            if (!stream.write(line)) {
                // Handle backpressure
                await new Promise<void>(resolve => stream.once('drain', resolve));
            }
        }
        stream.end();
    }

    // New scalable load method (JSONL)
    static async load(directory: string, embeddings: Embeddings): Promise<SimpleVectorStore> {
        const store = new SimpleVectorStore(embeddings);
        const filePath = path.join(directory, "vectors.jsonl");

        if (!fs.existsSync(filePath)) {
            throw new Error(`Vector store file not found at ${filePath}`);
        }

        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            if (line.trim()) {
                try {
                    const doc = JSON.parse(line) as VectorDoc;
                    store.vectors.push(doc);
                } catch (e) {
                    console.warn("Skipping invalid JSON line in vector store");
                }
            }
        }

        return store;
    }

    // Keep legacy for backward compat if needed, but not recommended for large files
    toJSON() {
        return JSON.stringify(this.vectors);
    }
}
