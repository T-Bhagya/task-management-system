# TMS Real-Time Notification Service (Person 4)

This service manages real-time WebSocket connections via **Socket.io** and implements a persistent **Offline Notification Storage** system using **Prisma & SQLite**.

---

## 🚀 How to Run Locally

1. Navigate to the folder:
   ```bash
   cd notification-service
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the interactive testing dashboard in your browser:
   * **`http://localhost:3003`**

---

## 🔗 Integration Guide for Team Members

### 1. For Person 1 (Frontend Developer — React + TS)
Install the Socket.io client library:
```bash
npm install socket.io-client
```

Connect to the WebSocket server in React:
```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3003', {
  auth: {
    // Option A: Send the real JWT token received during login
    token: localStorage.getItem('token'),
    // Option B (For local dev before Auth is ready): Pass userId directly
    userId: 'alice'
  }
});

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // 1. Listen for new real-time notifications
    socket.on('notification', (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      alert(`[${newNotif.title}] ${newNotif.message}`);
    });

    // 2. Receive notifications sent while you were offline
    socket.on('offline-notifications', (queuedNotifs) => {
      setNotifications((prev) => [...queuedNotifs, ...prev]);
    });

    return () => {
      socket.off('notification');
      socket.off('offline-notifications');
    };
  }, []);

  return notifications;
}
```

---

### 2. For Person 3 (Backend Tasks & Comments Developer)
Whenever a task is assigned, updated, or a comment is left, send a REST trigger request to the notification service:

```javascript
const axios = require('axios');

async function triggerNotification(userId, title, message, type) {
  try {
    await axios.post('http://localhost:3003/api/notifications', {
      userId,        // The recipient's user ID
      title,         // e.g. "New Comment Added"
      message,       // e.g. "John left a comment on Task #42"
      type           // e.g. "comment_added", "task_assigned", "task_overdue"
    });
  } catch (error) {
    console.error("Failed to trigger real-time notification:", error.message);
  }
}
```

---

### 3. For Person 2 (Auth Developer)
Ensure that the `JWT_SECRET` environment variable in the `notification-service/.env` matches the secret key used by your authentication service.
* When a user authenticates, the notification service will decode the token to identify their `userId`.

---

### 4. For Person 5 (DevOps & Testing Lead)
Expose port `3003` inside the container:
```dockerfile
# Dockerfile (inside notification-service)
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3003
CMD ["npm", "start"]
```