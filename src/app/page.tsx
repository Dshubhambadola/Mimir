"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Terminal } from "lucide-react";
import { ThinkingProcess } from "./components/ThinkingProcess";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Graph State
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [thoughtPath, setThoughtPath] = useState<{ node: string; output?: any }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, activeNode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user" as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setThoughtPath([]); // Reset logic path for new query
    setActiveNode(null);

    try {
      // Create a placeholder for the assistant response
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "node_start") {
                setActiveNode(data.node);
              } else if (data.type === "node_end") {
                setThoughtPath(prev => [...prev, { node: data.node, output: data.output }]);
                // If node is valid end of chain, activeNode might reset or stay until next start
              } else if (data.type === "token") {
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  // Avoid duplicating if react strict mode runs twice, but here it's state update.
                  // We just append.
                  const updated = { ...last, content: last.content + data.content };
                  return [...prev.slice(0, -1), updated];
                });
              }
            } catch (e) {
              console.error("Error parsing SSE:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Failed to connect to Mimir." }]);
    } finally {
      setLoading(false);
      setActiveNode(null);
    }
  };

  return (
    <main className="flex h-screen bg-black text-zinc-100 overflow-hidden font-sans selection:bg-purple-500/30">
      {/* Sidebar - Thinking Process */}
      <aside className="w-80 border-r border-zinc-900 bg-zinc-950/50 backdrop-blur-xl hidden md:block">
        <ThinkingProcess activeNode={activeNode} path={thoughtPath} />
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">

        {/* Header */}
        <header className="h-14 border-b border-zinc-800 flex items-center px-6 gap-2">
          <Terminal size={18} className="text-purple-500" />
          <h1 className="font-semibold tracking-tight text-sm">Mimir Agentic Interface</h1>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center opacity-30 text-center">
              <div>
                <Terminal size={48} className="mx-auto mb-4" />
                <p>Ready to research. Ask me anything.</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-3xl px-6 py-4 rounded-2xl ${msg.role === "user"
                    ? "bg-zinc-800 text-white"
                    : "bg-transparent border border-zinc-800 text-zinc-300"
                  }`}
              >
                <div className="prose prose-invert prose-sm">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 md:p-6 border-t border-zinc-900 bg-black/80 backdrop-blur-lg">
          <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Deploy a research agent..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full px-6 py-3.5 pr-12 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all font-light"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 p-1.5 bg-zinc-800 rounded-full hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              <Send size={16} className="text-zinc-400" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
