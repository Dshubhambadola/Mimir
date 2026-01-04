import { searchTool } from "./search";
import { localSearchTool } from "./local_search";

export const getTools = () => {
    // We check the environment variable to decide which tools to provide
    const useLocal = process.env.NEXT_PUBLIC_USE_LOCAL_LLM === "true";

    if (useLocal) {
        console.log("Using Local Search Tool");
        return [localSearchTool];
    }

    return [searchTool];
};
