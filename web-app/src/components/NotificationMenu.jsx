import React, { useState, useEffect } from 'react';
import {
  IconButton, Badge, Menu, MenuItem, ListItemText, ListItemIcon, Typography, Box, Button
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import notificationService from '../services/notificationService';
import { connectNotificationWebSocket, disconnectNotificationWebSocket } from '../services/notificationWebSocketService';

const NotificationMenu = ({ userId }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const open = Boolean(anchorEl);

  const fetchNotifications = async (uid) => {
    try {
      const res = await notificationService.getNotifications(uid);
      // Sort notifications by timestamp descending
      const parseTimestamp = (ts) => {
        if (typeof ts === 'string' && ts.startsWith('[')) {
          try {
            ts = JSON.parse(ts);
          } catch {
            return 0;
          }
        }
        if (Array.isArray(ts)) {
          return new Date(
            ts[0],
            ts[1] - 1,
            ts[2],
            ts[3],
            ts[4],
            ts[5],
            Math.floor(ts[6] / 1000)
          ).getTime();
        }
        return new Date(ts).getTime();
      };
      const notifications = (res.notifications || []).slice().sort((a, b) => {
        const tA = parseTimestamp(a.data.timestamp);
        const tB = parseTimestamp(b.data.timestamp);
        return tB - tA;
      });
      setNotifications(notifications);
      setUnreadCount((res.unreadCount || []));
      console.log("Fetched Notifications:", res);
    } catch (e) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    console.log("Connecting to WebSocket...");
    if (userId) {
      fetchNotifications(userId);
      // Connect to WebSocket for real-time notifications
      connectNotificationWebSocket(userId, (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
      return () => disconnectNotificationWebSocket();
    }
  }, [userId]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    if (userId) {
      fetchNotifications(userId);
    }
  };

  const handleClose = () => setAnchorEl(null);

  const handleMarkAsRead = async (id) => {
    await notificationService.markAsRead(userId, id);
    if (userId) {
      fetchNotifications(userId);
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        {unreadCount > 0 ? (
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        ) : (
          <NotificationsIcon />
        )}
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} sx={{ minWidth: 350 }}>
        <Box px={2} py={1}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        {notifications.length === 0 && (
          <MenuItem disabled>
            <ListItemText primary="No notifications" />
          </MenuItem>
        )}
        {notifications.map((n) => (
          <MenuItem
            key={n.id}
            selected={!n.isRead}
            onClick={() => handleMarkAsRead(n.id)}
            sx={{ alignItems: 'flex-start', whiteSpace: 'normal' }}
          >
            <ListItemIcon>
              {!n.isRead && <DoneAllIcon color="primary" fontSize="small" />}
            </ListItemIcon>
            <ListItemText
              primary={n.title || 'Notification'}
              secondary={
                <>
                  <Typography variant="body2" color="text.secondary">
                    {n.message}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {(() => {
                      let ts = n.data.timestamp;
                      if (typeof ts === 'string' && ts.startsWith('[')) {
                        try {
                          ts = JSON.parse(ts);
                        } catch {
                          // fallback to original string if parsing fails
                        }
                      }
                      if (Array.isArray(ts)) {
                        return new Date(
                          ts[0],
                          ts[1] - 1,
                          ts[2],
                          ts[3],
                          ts[4],
                          ts[5],
                          Math.floor(ts[6] / 1000)
                        ).toLocaleString();
                      }
                      // Handle numeric string or number (epoch ms), or ISO string
                      if (typeof ts === 'string' && !isNaN(Number(ts))) {
                        ts = Number(ts);
                      }
                      return new Date(ts).toLocaleString();
                    })()}
                  </Typography>
                </>
              }
            />
            {!n.isRead && (
              <Button size="small" onClick={e => { e.stopPropagation(); handleMarkAsRead(n.id); }}>
                Mark as read
              </Button>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default NotificationMenu;
