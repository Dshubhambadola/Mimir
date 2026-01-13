import { getModel } from "../utils/model";
import { getTools } from "../tools";

/**
 * The agent node uses the model to generate a response.
 * It binds the tools to the model so the model knows it can use them.
 */
export async function agentNode(state: { messages: any[] }) {
    const { messages } = state;
    const tools = getTools();
    const model = getModel().bindTools(tools);
    const prompt = `You are an advanced AI research assistant with access to a local codebase and a secure code execution environment.

1.  **For Information Retrieval**: Use 'local_codebase_search' (or 'tavily_search' if online) to find facts.
2.  **For Math/Logic/Data**: DO NOT do mental math. Write a Python or JavaScript script and use the 'execute_code' tool to run it.
3.  **For Code Testing**: If you write a snippet, you can verify it by running it.

Current User Query: ${messages[messages.length - 1].content}`;

    const response = await model.invoke([["user", prompt]]);
    return { messages: [response] };
}
