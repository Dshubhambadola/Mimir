import { StateGraph, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { agentNode } from "./nodes/agent";
import { criticNode } from "./nodes/critic";
import { getTools } from "./tools";
import { BaseMessage } from "@langchain/core/messages";

// Define the state interface
export interface AgentState {
    messages: BaseMessage[];
    critique?: { score: number; feedback: string };
    retry_count?: number;
}

// Prebuilt ToolNode checks for tool calls and executes them
const tools = getTools();
const toolNode = new ToolNode(tools);

// Define the graph
const workflow = new StateGraph<AgentState>({
    channels: {
        messages: {
            value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
            default: () => [],
        },
        critique: {
            value: (x, y) => y, // Overwrite with latest critique
            default: () => undefined,
        },
        retry_count: {
            value: (x, y) => (x || 0) + (y || 1), // Increment retries
            default: () => 0,
        }
    }
})
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addNode("critic", criticNode)

    .addEdge("__start__", "agent")

    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent")

    .addConditionalEdges("critic", shouldRepeat);

// Logic to determine if we should continue to tools or end (critic)
function shouldContinue(state: { messages: BaseMessage[] }) {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];

    // If the LLM makes a tool call, then we route to the "tools" node
    if ("tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls.length) {
        return "tools";
    }
    // Otherwise, we go to the critic for review
    return "critic";
}

// Logic to determine if we should loop back or end
function shouldRepeat(state: AgentState) {
    const { critique, retry_count } = state;

    // Safety Break: If we've retried more than 3 times, just stop to prevent infinite loops.
    // Also stop if quality is good enough (> 4/5)
    // Safety Break: If we've retried more than 3 times, just stop to prevent infinite loops.
    // Also stop if quality is good enough (> 4/5)
    if ((retry_count || 0) >= 3 || (critique && critique.score > 4)) {
        return END;
    }
    return "agent";
}

// @ts-ignore
export const app = workflow.compile({ recursionLimit: 50 });
