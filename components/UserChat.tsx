"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface ChatMessage {
  id?: number; //optional tho majorly its there
  username: string;
  text: string;
  timestamp: number;
}

interface UserChatProps {
  initialRoomCode?: string;
  onToggle?: () => void;
}

function getSocketInstance(): Socket { //to create fresh connection with each call
  return io(process.env.NEXT_PUBLIC_SOCKET_URL || ":3001", { transports: ["websocket", "polling"] });
}

export default function UserChat({ initialRoomCode, onToggle }: UserChatProps) {
  const [savedUsername, setSavedUsername] = useState("");
  const [roomCode, setRoomCode] = useState(initialRoomCode || "");
  const [inviteLink, setInviteLink] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [roomUsers, setRoomUsers] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const socketRef = useRef<Socket | null>(null); //holds socketio connection
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoJoined = useRef(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setSavedUsername(data.user.username);
      });
  }, []);

  useEffect(() => {  //scolls to the bottom ie follows the new message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (savedUsername && !connected) {
      const targetRoom = initialRoomCode || localStorage.getItem("dualchat-room"); //if the user is coming from the link then the initial room code will contain the room code
      if (targetRoom && !hasAutoJoined.current) {
        hasAutoJoined.current = true;
        setRoomCode(targetRoom);
        setInviteLink(`${window.location.origin}/chat-User/${targetRoom}`);

        const socket = getSocketInstance();
        socketRef.current = socket;

        socket.on("message-history", (history: ChatMessage[]) => {
          setMessages(history); //shows the history of the messages
          setHasMore(history.length === 50); // if has more than 50 then will show load more option
        });

        socket.on("older-messages", (older: ChatMessage[]) => { //getting the older messages from the server
          setMessages((prev) => [...older, ...prev]); //setting the older messages to the state of present
          setHasMore(older.length === 50);
          setLoadingMore(false);
        });

        socket.on("chat-message", (msg: ChatMessage) => {
          setMessages((prev) => [...prev, msg]); //changing the state of the messages to the new message that is sent by the user
        });

        socket.on("room-users", (users: string[]) => {
          setRoomUsers(users);
        });

        socket.on("user-joined", ({ username: user }: { username: string }) => {
          setMessages((prev) => [  //set the message of new user joining
            ...prev,
            { username: "System", text: `${user} joined the room`, timestamp: Date.now() },
          ]);
        });

        socket.on("user-left", ({ username: user }: { username: string }) => {
          setMessages((prev) => [ //set the message of user leaving
            ...prev,
            { username: "System", text: `${user} left the room`, timestamp: Date.now() },
          ]);
        });

        socket.emit("join-room", { roomCode: targetRoom, username: savedUsername });
        localStorage.setItem("dualchat-room", targetRoom); ///storing in the local storage for future use
        setConnected(true);
      }
    }
  }, [savedUsername]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect(); //when user aint there we disconnect with the socket
      socketRef.current = null;
    };
  }, []);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    setInviteLink(`${window.location.origin}/chat-User/${code}`);
    localStorage.setItem("dualchat-room", code);
    joinRoom(code);
  };

  const handleJoinRoom = () => {  //for the input to join a room
    if (joinCode.trim()) {
      const code = joinCode.trim().toUpperCase();
      setRoomCode(code);
      localStorage.setItem("dualchat-room", code);
      joinRoom(code);
    }
  };

  const joinRoom = (code: string) => {  //joining the room with the code
    setInviteLink(`${window.location.origin}/chat-User/${code}`);
    localStorage.setItem("dualchat-room", code); //storing in the local storage in case of refresh

    const socket = getSocketInstance(); //socket port 
    socketRef.current = socket; //storing the socket in the ref for future use

    socket.on("message-history", (history: ChatMessage[]) => {
      setMessages(history);
      setHasMore(history.length === 50);
    });

    socket.on("older-messages", (older: ChatMessage[]) => {
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length === 50);
      setLoadingMore(false);
    });

    socket.on("chat-message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("room-users", (users: string[]) => {
      setRoomUsers(users);
    });

    socket.on("user-joined", ({ username: user }: { username: string }) => {
      setMessages((prev) => [
        ...prev,
        { username: "System", text: `${user} joined the room`, timestamp: Date.now() },
      ]);
    });

    socket.on("user-left", ({ username: user }: { username: string }) => {
      setMessages((prev) => [
        ...prev,
        { username: "System", text: `${user} left the room`, timestamp: Date.now() },
      ]);
    });

    socket.emit("join-room", { roomCode: code, username: savedUsername });
    setConnected(true);
  };

  const handleLoadMore = () => {
    if (!socketRef.current || !hasMore || loadingMore) return;
    const oldestId = messages.find((m) => m.id)?.id;
    if (!oldestId) return;
    setLoadingMore(true);
    socketRef.current.emit("load-more", { roomCode, beforeId: oldestId });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    socketRef.current.emit("chat-message", {
      roomCode,
      username: savedUsername,
      text: input,
    });
    setInput("");
  };

  const handleLeaveRoom = () => {
    socketRef.current?.emit("leave-room", { roomCode });
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
    setRoomCode("");
    setInviteLink("");
    setMessages([]);
    setRoomUsers([]);
    setJoinCode("");
    setHasMore(true);
    localStorage.removeItem("dualchat-room");
    hasAutoJoined.current = false;
    document.cookie = "pending-room=; path=/; max-age=0";
  };

  const handleLogout = async () => {
    localStorage.removeItem("dualchat-room");
    document.cookie = "pending-room=; path=/; max-age=0";
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/?auth=login";
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!savedUsername) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-r from-taupe-700 to-zinc-900 dark:from-[#171717] dark:to-[#0D0D0F] transition-colors duration-300">
        <div className="text-gray-400 dark:text-[#8B949E]">Loading...</div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-linear-to-r from-taupe-700 to-zinc-900 dark:from-[#171717] dark:to-[#0D0D0F] transition-colors duration-300">
        {onToggle && (
          <button
            onClick={onToggle}
            className="fixed top-6 left-6 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20 dark:hover:bg-violet-500/20"
          >
             AI Chat
          </button>
        )}
        <div className="w-full max-w-sm p-8 rounded-xl shadow-xl bg-white dark:bg-[#161B22] border border-gray-300 dark:border-[#2A2F38]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#E6EDF3]">
              User Chat
            </h2>
            <span className="text-xs text-gray-500 dark:text-[#8B949E]">
              {savedUsername}
            </span>
          </div>

          <button
            onClick={handleCreateRoom}
            className="w-full p-3 mb-4 rounded-xl font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
          >
            Create Room
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-gray-200 dark:bg-[#2A2F38]" />
            <span className="text-xs text-gray-400 dark:text-[#8B949E]">or</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-[#2A2F38]" />
          </div>

          <input
            className="w-full p-3 mb-3 outline-none rounded-xl bg-transparent text-gray-900 placeholder-gray-400 border border-gray-300 dark:border-[#2A2F38] dark:text-[#E6EDF3] dark:placeholder-[#8B949E] focus:ring-2 focus:ring-emerald-400 dark:focus:ring-[#5EEAD4]"
            value={joinCode}
            placeholder="Enter room code..."
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
          />
          <button
            onClick={handleJoinRoom}
            disabled={!joinCode.trim()}
            className="w-full p-3 rounded-xl font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-[#E6EDF3] dark:bg-[#21262D] dark:hover:bg-[#30363D]"
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-xl py-24 mx-auto min-h-screen rounded-xl shadow-xl bg-linear-to-r from-taupe-700 to-zinc-900 dark:from-[#171717] dark:to-[#0D0D0F] transition-colors duration-300">
      <div className="fixed top-0 left-0 right-0 z-10 w-full max-w-xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/90 dark:bg-[#161B22]/90 backdrop-blur border border-gray-200 dark:border-[#2A2F38]">
          <div className="flex items-center gap-2">
            <button
              onClick={copyRoomCode}
              className="text-xs font-mono px-2 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
              title="Click to copy room code"
            >
              {copiedCode ? "Copied!" : roomCode}
            </button>
            <span className="text-xs text-gray-500 dark:text-[#8B949E]">
              {roomUsers.length} online
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onToggle && (
              <button
                onClick={onToggle}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50"
              >
                 AI
              </button>
            )}
            {inviteLink && (
              <button
                onClick={copyInviteLink}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
              >
                {copied ? "Copied!" : "Copy Invite"}
              </button>
            )}
            <button
              onClick={handleLeaveRoom}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              Leave
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#21262D] dark:text-[#8B949E] dark:hover:bg-[#30363D]"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {inviteLink && (
        <div className="fixed top-20 left-0 right-0 z-10 w-full max-w-xl mx-auto px-4 mb-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 truncate flex-1 font-mono">
              {inviteLink}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-7 mb-20 mt-28">
        {hasMore && messages.length > 0 && (
          <div className="text-center my-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-colors bg-white/10 text-white/60 hover:bg-white/20 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 disabled:opacity-40"
            >
              {loadingMore ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={m.id || `msg-${i}`}
            className={`mb-4 p-2 flex ${
              m.username === "System"
                ? "justify-center"
                : m.username === savedUsername
                  ? "justify-end"
                  : "justify-start"
            }`}
          >
            {m.username === "System" ? (
              <div className="text-xs text-gray-400 dark:text-[#8B949E] italic">
                {m.text}
              </div>
            ) : (
              <div
                className={`max-w-[75%] p-3 rounded-xl text-white ${
                  m.username === savedUsername
                    ? "bg-linear-to-r from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800"
                    : "bg-linear-to-r from-sky-600 to-sky-800 dark:from-sky-700 dark:to-sky-900"
                }`}
              >
                <span className="font-semibold text-white/70 block text-xs mb-1 uppercase tracking-wide">
                  {m.username}
                </span>
                <p className="text-sm">{m.text}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="fixed left-0 right-0 bottom-0 w-full max-w-md mb-8 mx-auto border rounded-xl shadow-xl transition-colors bg-white border-gray-300 dark:bg-[#161B22] dark:border-[#2A2F38]"
      >
        <input
          className="w-full p-3 outline-none rounded-xl transition-shadow bg-transparent text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-400 dark:text-[#E6EDF3] dark:placeholder-[#8B949E] dark:focus:ring-[#5EEAD4]"
          value={input}
          placeholder="Type a message..."
          onChange={(e) => setInput(e.target.value)}
        />
      </form>
    </div>
  );
}
