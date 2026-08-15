"use client";

import { useChat } from "@ai-sdk/react"; //To create real-tome conversation chatbot
import { DefaultChatTransport } from "ai"; //sends the req to backend to fetches the response as well
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown"; //convert AI markdown response to HTML

export default function Chat({ onToggle }: { onToggle?: () => void }) { //ontoggle in the child itself do nothing but in the parent it will toggle the chat window
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat-AI" }), //showing it the way to backend
  });

  const [input, setInput] = useState("");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/?auth=login";
  };

  return (
    <div className="flex flex-col w-full h-dvh max-w-xl mx-auto bg-linear-to-r from-taupe-700 to-zinc-900 dark:from-[#171717] dark:to-[#0D0D0F] transition-colors duration-300">
      <header className="shrink-0 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/90 dark:bg-[#161B22]/90 backdrop-blur border border-gray-200 dark:border-[#2A2F38]">
          <span className="text-sm font-bold text-gray-900 dark:text-[#E6EDF3] px-1.5">
            AI Chat
          </span>
          <div className="flex items-center gap-1.5">
            {onToggle && (
              <button
                onClick={onToggle}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20"
              >
                User Chat
              </button>
            )}
            <button
              onClick={() => setIsDark(!isDark)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors bg-black/5 text-gray-800 border border-gray-300 hover:bg-black/10 dark:bg-[#1C1C1F] dark:text-white dark:border-[#2A2A2E] dark:hover:bg-[#26262A]"
            >
              {isDark ? "☀ Light" : "🌙 Dark"}
            </button>
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors bg-red-500/10 text-red-700 border border-red-500/30 hover:bg-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start" //the message has property as to who is sending the mesage
            }`}
          >
            <div
              className={`max-w-[75%] p-3 rounded-xl text-white ${
                m.role === "user"
                  ? "bg-linear-to-r from-violet-500 to-violet-700 dark:from-violet-600 dark:to-violet-800"
                  : "bg-linear-to-r from-rose-800 to-rose-500 dark:from-rose-900 dark:to-rose-700"
              }`}
            >
              <span className="font-semibold text-white/70 block text-xs mb-1 uppercase tracking-wide">
                {m.role === "user" ? "You" : "AI"}
              </span>
              {m.parts.map((part, index) =>  //bring versatile nature to the chat like images and bold text
                part.type === "text" ? (
                  <ReactMarkdown key={index}>{part.text}</ReactMarkdown>
                ) : null,
              )}
            </div>
          </div>
        ))}

        {status === "submitted" && (
          <div className="text-gray-400 dark:text-[#8B949E] text-sm italic">
            AI is typing...
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="border rounded-xl shadow-xl transition-colors bg-white border-gray-300 dark:bg-[#161B22] dark:border-[#2A2F38]">
          <input
            className="w-full p-3 outline-none rounded-xl transition-shadow bg-transparent text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-violet-400 dark:text-[#E6EDF3] dark:placeholder-[#8B949E] dark:focus:ring-[#5EEAD4]"
            value={input}
            placeholder="Say something to Gemini..."
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== "ready"}
          />
        </div>
      </form>
    </div>
  );
}
