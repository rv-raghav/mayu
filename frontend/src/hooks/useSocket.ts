import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getPublicSocket, getAnalyticsSocket } from '@/lib/socket';

export function usePublicSocket(slug: string | undefined) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!slug) return;
    
    const socket = getPublicSocket();
    socketRef.current = socket;

    socket.emit('join', { slug });

    return () => {
      // We don't necessarily disconnect the shared socket, but we could emit 'leave' if implemented on server
      socket.emit('leave', { slug });
    };
  }, [slug]);

  return socketRef.current;
}

export function useAnalyticsSocket(pollId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!pollId) return;

    const socket = getAnalyticsSocket();
    socketRef.current = socket;

    socket.connect();
    socket.emit('join', { pollId });

    return () => {
      socket.emit('leave', { pollId });
      socket.disconnect(); // Disconnect to save resources when unmounting analytics
    };
  }, [pollId]);

  return socketRef.current;
}
