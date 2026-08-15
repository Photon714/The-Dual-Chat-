"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Chat from "../components/chatWindow";
import UserChat from "../components/UserChat";
import AuthScreen from "../components/AuthScreen";

function readPendingRoom(): string | null {
  if (typeof window === "undefined") return null;
  const cookie = document.cookie.split("; ").find((c) => c.startsWith("pending-room="));
  if (!cookie) return null;
  const roomCode = cookie.split("=")[1];
  document.cookie = "pending-room=; path=/; max-age=0";
  return roomCode || null;
}

function Home() {
  const searchParams = useSearchParams();
  const authParam = searchParams.get("auth");//fetches the auth param from the url
  const [pendingRoom, setPendingRoom] = useState<string | null>(null);//TO search for any rooms like if user comes through link but isnt logged in then its q-ed
  const [mode, setMode] = useState<"ai" | "user">("ai");
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true);
          const room = readPendingRoom();
          if (room) {
            setPendingRoom(room);
            setMode("user");
          }
        }
      })
      .finally(() => setChecking(false));
  }, []);

  if (authParam === "login" || (!checking && !authenticated)) {
    return <AuthScreen onAuth={() => { setAuthenticated(true); window.location.href = "/"; }} />;
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-r from-taupe-700 to-zinc-900 dark:from-[#171717] dark:to-[#0D0D0F]">
        <div className="text-gray-400 dark:text-[#8B949E]">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {mode === "ai" ? (
        <Chat onToggle={() => setMode("user")} />
      ) : (
        <UserChat onToggle={() => setMode("ai")} initialRoomCode={pendingRoom || undefined} />
      )}
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Home />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-r from-taupe-700 to-zinc-900 dark:from-[#171717] dark:to-[#0D0D0F]">
      <div className="text-gray-400 dark:text-[#8B949E]">Loading...</div>
    </div>
  );
}
