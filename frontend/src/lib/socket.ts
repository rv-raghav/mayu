import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// We manage two sockets: one for public polls, one for authenticated analytics
let publicSocket: Socket | null = null;
let analyticsSocket: Socket | null = null;

export const getPublicSocket = () => {
  if (!publicSocket) {
    publicSocket = io(`${SOCKET_URL}/polls`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return publicSocket;
};

export const getAnalyticsSocket = () => {
  if (!analyticsSocket) {
    const token = useAuthStore.getState().accessToken;
    analyticsSocket = io(`${SOCKET_URL}/analytics`, {
      transports: ['websocket', 'polling'],
      autoConnect: false, // We manually connect after attaching token
      auth: { token },
    });
  } else {
    // Ensure token is fresh
    analyticsSocket.auth = { token: useAuthStore.getState().accessToken };
  }
  return analyticsSocket;
};

export const disconnectSockets = () => {
  if (publicSocket) {
    publicSocket.disconnect();
    publicSocket = null;
  }
  if (analyticsSocket) {
    analyticsSocket.disconnect();
    analyticsSocket = null;
  }
};
