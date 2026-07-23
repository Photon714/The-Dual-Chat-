"use client";

import { useParams } from "next/navigation";
import UserChat from "@/components/UserChat";

export default function ChatRoomPage() {  //for a joined room we will use the room code to join the room and display the chat
  const params = useParams<{ roomCode: string }>();

  return <UserChat initialRoomCode={params.roomCode} />;  //rendering the user chat for that particular room code
}
