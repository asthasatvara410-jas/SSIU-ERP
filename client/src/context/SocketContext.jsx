import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Only connect WebSocket if user is logged in
    if (currentUser) {
      const newSocket = io(import.meta.env.VITE_API_BASE_URL.replace('/api', ''), {
        // You can pass auth tokens here if you want to secure the socket connection
        // auth: { token: currentUser.accessToken }
      });

      newSocket.on('connect', () => {
        console.log('[Socket] Connected to real-time server');
      });

      newSocket.on('disconnect', () => {
        console.warn('[Socket] Disconnected from server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      // If user logs out, disconnect socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [currentUser]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
