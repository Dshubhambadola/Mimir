# 🧠 Mimir: Self-Reflective Research Agent

**Mimir** is an intelligent research assistant that "thinks before it speaks." Unlike standard chatbots that simply query and answer, Mimir employs a **Reflection Loop**—it critiques its own findings, checks for hallucinations, and refines its answers before presenting them to you.

![Mimir Architecture](https://mimir-agent-demo.vercel.app/og.png) *<!-- Replace with actual screenshot if available -->*

## ✨ Key Features

- **🔄 Reflection Loops**: Implements a `Researcher -> Critic -> Refiner` cycle using **LangGraph**. The agent self-corrects low-quality answers.
- **👁️ Visual Thought Process**: A "Living UI" built with **Next.js** and **Framer Motion** that visualizes the agent's neural state in real-time.
- **🛡️ Privacy Mode (Local)**: Switch to an entirely offline stack using **Ollama (Llama 3)** and local vector search.
- **📚 Local RAG**: Ingest your private codebase or documents to chat with your proprietary data securely.
- **☁️ Cloud/Local Hybrid**: Seamlessly toggle between Google Gemini/Anthropic Claude (Cloud) and Local Llama 3.

## 🛠️ Tech Stack

- **Orchestration**: [LangGraph.js](https://langchain-ai.github.io/langgraphjs/)
- **Frontend**: Next.js 14 (App Router), TailwindCSS, Framer Motion
- **LLMs**: Google Gemini 1.5 Pro, Claude 3.5 Sonnet, Llama 3 (via Ollama)
- **Search**: Tavily API (Cloud), HNSWLib (Local)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18+
- **Google Generative AI Key** (for Gemini) OR **Anthropic Key** (for Claude)
- **Tavily API Key** (for Web Search)
- *(Optional)* **Ollama** installed locally for Privacy Mode.

### 2. Installation

```bash
git clone https://github.com/yourusername/mimir.git
cd mimir
npm install
```

### 3. Configuration

Duplicate the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your keys:

```env
# --- CLOUD MODE (Default) ---
GOOGLE_API_KEY=AIzaSy...
TAVILY_API_KEY=tvly-...

# --- LOCAL MODE (Optional) ---
# NEXT_PUBLIC_USE_LOCAL_LLM=true
# OLLAMA_BASE_URL=http://localhost:11434
```

---

## 🖥️ Running the Application

### Web Interface (Recommended)
Launch the beautiful agentic UI:

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### CLI Verification
Run a quick test query from your terminal:

```bash
npx tsx src/scripts/run.ts "What are the latest features in Next.js?"
```

---

## 🔒 Privacy Mode (Home Lab)

Run Mimir entirely offline using your local hardware.

### 1. Setup Ollama
Ensure [Ollama](https://ollama.com/) is running and pull the model:
```bash
ollama pull llama3
```

### 2. Ingest Your Data (Local RAG)
Scan and index your private codebase or documents:
```bash
# Usage: npx tsx src/scripts/ingest.ts <absolute-path-to-directory>
npx tsx src/scripts/ingest.ts /Users/me/projects/secret-repo
```
This creates a local vector store in `./data/vector_store`.

### 3. Enable Local Mode
Update your `.env.local` to switch the brain:

```env
NEXT_PUBLIC_USE_LOCAL_LLM=true
```

Restart the server. Mimir will now ignore Cloud APIs and use your local Llama 3 instance and local docs.

---

## 🧩 Architecture

The system is built on a **StateGraph**:

1.  **`__start__`**: User query enters the graph.
2.  **`Agent`**: calls LLM to decide on actions (search vs. answer).
3.  **`Tools`**: Executes search (Tavily or Local Vector Store).
4.  **`Critic`**: (If enabled) Reviews the Agent's answer on a 1-5 scale.
    *   **Score > 4**: Stream to user.
    *   **Score <= 4**: Reject and send feedback loop back to Agent.

## 🤝 Contributing

Contributions are welcome! Please run `npm run lint` before submitting a PR.
