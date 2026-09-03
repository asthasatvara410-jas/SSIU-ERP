import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Assuming you have an AuthContext to get the current user/token.
// If not, you will need to adapt this to however the Vite app handles Auth.
// import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // In a real implementation, you would depend on the user's auth state
  // const { token } = useAuth();
  const token = localStorage.getItem('token'); // Fallback placeholder

  useEffect(() => {
    // Connect to the NestJS backend WebSocket gateway
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5500';
    
    const socketInstance = io(backendUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'], // Prefer websocket
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.IO] Connected to backend real-time server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.warn('[Socket.IO] Disconnected from real-time server');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
