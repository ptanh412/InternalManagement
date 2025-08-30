import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { getToken } from './localStorageService';

let stompClient = null;

const token = getToken();
console.log("Using token:", token);

export function connectNotificationWebSocket(userId, onNotification) {
  const socket = new SockJS('http://localhost:8082/notification/ws');
  stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    connectHeaders:{
      Authorization: `Bearer ${token}`
    },
    onConnect: () => {
      console.log('WebSocket connected successfully');
      stompClient.subscribe('/user/queue/notifications', (message) => {
        console.log('Received notification from /user/queue/notifications', message.body);
        onNotification(JSON.parse(message.body));
      });
      console.log('Subscribed to /user/queue/notifications');
    },
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    },
    onWebSocketClose: () => {
      console.log('WebSocket connection closed');
    },
    onWebSocketError: (error) => {
      console.error('WebSocket error', error);
    }
  });
  stompClient.activate();
}

export function disconnectNotificationWebSocket() {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
    console.log('WebSocket disconnected');
  }
}