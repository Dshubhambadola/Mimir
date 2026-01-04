import { tavily } from "@tavily/core";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const searchTool = tool(
    async ({ query }) => {
        // We assume TAVILY_API_KEY is in process.env
        const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
        const response = await tvly.search(query, {
            maxResults: 3,
        });
        // Return a stringified version of the results for the LLM
        return JSON.stringify(response.results);
    },
    {
        name: "tavily_search",
        description: "Search the web for current information. Use this when the user asks for facts or current events.",
        schema: z.object({
            query: z.string().describe("The search query"),
        }),
    }
);
