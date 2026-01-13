import { app as graph } from "@/graph";
import { HumanMessage } from "@langchain/core/messages";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]; // User's query

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const eventStream = await graph.streamEvents(
                    { messages: [new HumanMessage(lastMessage.content)] },
                    { version: "v2" }
                );

                for await (const { event, data, name, metadata } of eventStream) {
                    // Stream "start" events for nodes to visualize the path
                    if (event === "on_chain_start" && (name === "agent" || name === "critic" || name === "tools")) {
                        const packet = { type: "node_start", node: name };
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(packet)}\n\n`));
                    }
                    // Stream "end" events for nodes to show completion/outputs
                    else if (event === "on_chain_end" && (name === "agent" || name === "critic" || name === "tools")) {
                        // For critic, we might want to send the score specifically
                        const packet = { type: "node_end", node: name, output: data.output };
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(packet)}\n\n`));
                    }
                    // Stream tokens from the model (ONLY for the 'agent' node)
                    // We check metadata.langgraph_node to ensure we only show the main agent's output, not the critic's.
                    else if (
                        event === "on_chat_model_stream" &&
                        data.chunk.content &&
                        metadata &&
                        metadata.langgraph_node === "agent"
                    ) {
                        const token = data.chunk.content;
                        // Safety: Check if controller is still active
                        if (controller.desiredSize !== null) {
                            const packet = { type: "token", content: token };
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify(packet)}\n\n`));
                        }
                    }
                }
                if (controller.desiredSize !== null) {
                    controller.close();
                }
            } catch (e) {
                console.error("Streaming error:", e);
                controller.error(e);
            }
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
