import { app, AgentState } from "../graph";
import { HumanMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
    const query = process.argv[2] || "What is the capital of France?";
    console.log(`--- Starting Agent with Query: "${query}" ---\n`);

    const result = await app.invoke({
        messages: [new HumanMessage(query)],
    }) as unknown as AgentState;

    const finalMessage = result.messages[result.messages.length - 1];
    console.log("\n--- Final Answer ---");
    console.log(finalMessage.content);
}

main().catch(console.error);
