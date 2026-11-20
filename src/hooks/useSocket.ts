'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io({
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
    }

    socketRef.current = globalSocket;

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    globalSocket.on('connect', onConnect);
    globalSocket.on('disconnect', onDisconnect);

    if (globalSocket.connected) {
      setIsConnected(true);
    }

    return () => {
      if (globalSocket) {
        globalSocket.off('connect', onConnect);
        globalSocket.off('disconnect', onDisconnect);
      }
    };
  }, []);

  return {
    socket: socketRef.current || globalSocket,
    isConnected,
  };
}
