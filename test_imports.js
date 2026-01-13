try {
    const { MemoryVectorStore } = require("langchain/vectorstores/memory");
    console.log("Success: langchain/vectorstores/memory");
} catch (e) {
    console.log("Failed: langchain/vectorstores/memory", e.code);
}

try {
    const { MemoryVectorStore } = require("langchain/vectorstores");
    console.log("Success: langchain/vectorstores");
} catch (e) {
    console.log("Failed: langchain/vectorstores", e.code);
}

try {
    const { MemoryVectorStore } = require("@langchain/community/vectorstores/memory");
    console.log("Success: @langchain/community/vectorstores/memory");
} catch (e) {
    console.log("Failed: @langchain/community/vectorstores/memory", e.code);
}

try {
    const { MemoryVectorStore } = require("langchain");
    console.log("Success: langchain root");
} catch (e) {
    console.log("Failed: langchain root", e.code);
}
