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
    const response = await model.invoke(messages);
    return { messages: [response] };
}
