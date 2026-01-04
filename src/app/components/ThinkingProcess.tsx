"use client";

import { motion } from "framer-motion";
import { Brain, Search, MessageSquare, Repeat } from "lucide-react";
import clsx from "clsx";

interface ThinkingProcessProps {
    activeNode: string | null;
    path: { node: string; output?: any }[];
}

export function ThinkingProcess({ activeNode, path }: ThinkingProcessProps) {
    return (
        <div className="w-full h-full p-4 flex flex-col gap-4 overflow-y-auto">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">
                Neural State
            </h3>

            <div className="flex flex-col gap-8 relative">
                {/* Connection Line */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-zinc-800 -z-10" />

                {path.map((step, idx) => (
                    <NodeItem
                        key={idx}
                        node={step.node}
                        status="completed"
                        isLast={false}
                    />
                ))}

                {activeNode && (
                    <NodeItem
                        key="active"
                        node={activeNode}
                        status="active"
                        isLast={true}
                    />
                )}
            </div>
        </div>
    );
}

function NodeItem({ node, status, isLast }: { node: string; status: "active" | "completed"; isLast: boolean }) {
    const isActive = status === "active";

    let label = "Thinking";
    let icon = Brain;
    let color = "bg-blue-500";

    switch (node) {
        case "agent":
            label = "Generating";
            icon = MessageSquare;
            color = "bg-emerald-500";
            break;
        case "tools":
            label = "Researching";
            icon = Search;
            color = "bg-amber-500";
            break;
        case "critic":
            label = "Critiquing";
            icon = Brain;
            color = "bg-rose-500";
            break;
    }

    const Icon = icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-4"
        >
            <div className={clsx(
                "relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2",
                isActive ? "border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "border-zinc-700 bg-zinc-900",
                isActive ? color : "text-zinc-500"
            )}>
                <Icon size={14} className={isActive ? "text-white" : "text-zinc-500"} />

                {isActive && (
                    <motion.div
                        className={clsx("absolute inset-0 rounded-full opacity-50", color)}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                )}
            </div>

            <div className="pt-1">
                <p className={clsx("text-sm font-medium", isActive ? "text-white" : "text-zinc-500")}>
                    {label}
                </p>
                <p className="text-xs text-zinc-600 font-mono mt-0.5 uppercase">
                    {node}
                </p>
            </div>
        </motion.div>
    );
}
