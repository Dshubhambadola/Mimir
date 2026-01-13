import { DynamicTool } from "@langchain/core/tools";
import { tavily_search } from "./search";
import { local_codebase_search } from "./local_search";
import { execute_code } from "./execute_code";

export function getTools() {
    const useLocal = process.env.NEXT_PUBLIC_USE_LOCAL_LLM === "true";

    if (useLocal) {
        return [local_codebase_search, execute_code];
    }
    return [tavily_search, execute_code];
}
