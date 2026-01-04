import { getModel } from "../utils/model";
import { z } from "zod";
import { SystemMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";

const critiqueSchema = z.object({
    score: z.number().int().min(1).max(5).describe("The quality score of the answer from 1-5"),
    feedback: z.string().describe("Critique of what is missing or incorrect if score < 5"),
});

export async function criticNode(state: { messages: BaseMessage[] }) {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    const query = messages[0].content;

    const model = getModel().withStructuredOutput(critiqueSchema);

    const prompt = `You are a strict technical critic. 
  Review the following answer to the user's query.
  Query: ${query}
  
  Answer: ${lastMessage.content}
  
  Rate it 1-5. 
  5 = Perfect, includes citations if needed, fully answers the prompt.
  1 = Terrible, hallucinated or irrelevant.
  
  Provide constructive feedback if not perfect.`;

    const response = await model.invoke([new SystemMessage(prompt)]);

    // Return the critique in state, AND append a message so the agent sees it in the next loop
    return {
        critique: response,
        messages: [new HumanMessage(`[Critique] Score: ${response.score}/5. Feedback: ${response.feedback}`)]
    };
}
