import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";

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

    // Helper to save/load
    toJSON() {
        return JSON.stringify(this.vectors);
    }

    static fromJSON(json: string, embeddings: Embeddings): SimpleVectorStore {
        const store = new SimpleVectorStore(embeddings);
        store.vectors = JSON.parse(json);
        return store;
    }
}
