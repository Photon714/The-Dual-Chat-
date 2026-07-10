"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Chat() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
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

  return (
    <div className="flex flex-col w-full max-w-xl py-24 mx-auto min-h-screen rounded-xl shadow-xl bg-linear-to-r from-taupe-700 to-zinc-900 dark:from-[#171717] dark:to-[#0D0D0F] transition-colors duration-300">
      <button
        onClick={() => setIsDark(!isDark)}
        className="fixed top-6 right-6 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors bg-white/10 text-white border-white/20 hover:bg-white/20 dark:bg-[#1C1C1F] dark:border-[#2A2A2E] dark:hover:bg-[#26262A]"
      >
        {isDark ? "☀ Light" : "🌙 Dark"}
      </button>
      <div className="flex-1 overflow-y-auto px-7 mb-20">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`mb-4 p-2 flex ${
              m.role === "user" ? "justify-end" : "justify-start"
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
                {m.role === "user" ? "You" : "Gemini"}
              </span>
              {m.parts.map((part, index) =>
                part.type === "text" ? (
                  <ReactMarkdown key={index}>{part.text}</ReactMarkdown>
                ) : null,
              )}
            </div>
          </div>
        ))}

        {status === "submitted" && (
          <div className="text-gray-400 dark:text-[#8B949E] mt-2 italic">
            Gemini is typing...
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="fixed left-0 right-0 bottom-0 w-full max-w-md mb-8 mx-auto border rounded-xl shadow-xl transition-colors bg-white border-gray-300 dark:bg-[#161B22] dark:border-[#2A2F38]"
      >
        <input
          className="w-full p-3 outline-none rounded-xl transition-shadow bg-transparent text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-violet-400 dark:text-[#E6EDF3] dark:placeholder-[#8B949E] dark:focus:ring-[#5EEAD4]"
          value={input}
          placeholder="Say something to Gemini..."
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "ready"}
        />
      </form>
    </div>
  );
}
