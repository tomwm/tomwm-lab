'use client';

import { useAppContext } from '@/context/AppContext';
import ChatShell from '@/components/chat/ChatShell';

export default function ChatPage() {
  const { assessment } = useAppContext();
  // No guard — chat is open to all; Sylvan adapts greeting based on whether
  // an assessment exists
  return <ChatShell hasAssessment={!!assessment} />;
}
