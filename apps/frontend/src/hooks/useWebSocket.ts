import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || (import.meta.env.VITE_API_URL?.replace('/api', '') ?? '');

export interface NotificationEvent {
  type: string;
  title: string;
  message: string;
  relatedItemId?: string;
  createdAt: string;
}

export type NotificationHandler = (event: NotificationEvent) => void;

/**
 * useWebSocket – connects to the backend WebSocket server and listens for
 * real-time notification events for the authenticated user.
 *
 * @param userId  The current user's ID. Pass null/undefined when not logged in.
 * @param onNotification  Callback invoked for each incoming notification event.
 */
export function useWebSocket(
  userId: string | null | undefined,
  onNotification: NotificationHandler,
) {
  const socketRef = useRef<Socket | null>(null);
  const onNotificationRef = useRef(onNotification);

  // Keep the callback ref up-to-date without re-connecting
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  const connect = useCallback(() => {
    if (!userId || socketRef.current?.connected) return;

    const socket = io(`${WS_URL}/ws`, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      socket.emit('join', { userId });
    });

    socket.on('notification', (event: NotificationEvent) => {
      onNotificationRef.current(event);
    });

    socket.on('disconnect', () => {
      // Will auto-reconnect based on socket.io settings
    });

    socketRef.current = socket;
  }, [userId]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  useEffect(() => {
    if (userId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);
}
