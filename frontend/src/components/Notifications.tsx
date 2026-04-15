import React, { useState, useEffect } from 'react';
import styles from '../pages/FriendsPage.module.css'

// ── Types ─────────────────────────────────────────────────────────────

interface Notification {
  _id: string;
  recipientId: string;
  type:
    | 'friend_request'
    | 'alert'
    | 'birthday'
    | 'support_received'
    | 'birthday_wish_received';
  content: string;
  createdAt: Date;
  isRead: boolean;
  relatedId: string;
  senderName: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────

const mockNotifications: Notification[] = [
  {
    _id: '1',
    recipientId: 'user1',
    type: 'friend_request',
    content: '',
    createdAt: new Date(),
    isRead: false,
    relatedId: 'user2',
    senderName: 'John Doe'
  },
  {
    _id: '3',
    recipientId: 'user1',
    type: 'birthday',
    content: '',
    createdAt: new Date(),
    isRead: false,
    relatedId: 'user3',
    senderName: 'Alex'
  },
  {
    _id: '4',
    recipientId: 'user1',
    type: 'alert',
    content: 'I could use some well wishes for my upcoming test',
    createdAt: new Date(),
    isRead: false,
    relatedId: 'user4',
    senderName: 'Mike'
  },
  {
    _id: '5',
    recipientId: 'user1',
    type: 'support_received',
    content: 'You got this! Keep going! 💙',
    createdAt: new Date(),
    isRead: false,
    relatedId: 'user5',
    senderName: 'Emily'
  },
  {
    _id: '6',
    recipientId: 'user1',
    type: 'birthday_wish_received',
    content: 'Happy Birthday! Hope you have a great day! 🎉',
    createdAt: new Date(),
    isRead: false,
    relatedId: 'user6',
    senderName: 'Chris'
  }
];

// ── Helpers ───────────────────────────────────────────────────────────

const notificationIcon = (type: Notification['type']): string => {
  switch (type) {
    case 'friend_request':          return '👤';
    case 'birthday':                return '🎂';
    case 'alert':                   return '🤝';
    case 'support_received':        return '💙';
    case 'birthday_wish_received':  return '🎉';
    default:                        return '🔔';
  }
};

const notificationLabel = (type: Notification['type'], senderName?: string): string => {
  switch (type) {
    case 'friend_request':          return `Friend request from ${senderName}`;
    case 'birthday':                return `Send a birthday wish to ${senderName}`;
    case 'alert':                   return `Send support to ${senderName}`;
    case 'support_received':        return `Support message from ${senderName}`;
    case 'birthday_wish_received':  return `Birthday wish from ${senderName}`;
    default:                        return 'Notification';
  }
};

const isRespondable = (type: Notification['type']): boolean =>
  type === 'birthday' || type === 'alert';

const isViewOnly = (type: Notification['type']): boolean =>
  type === 'support_received' || type === 'birthday_wish_received';

// ── Modal ─────────────────────────────────────────────────────────────

interface ModalProps {
  notification: Notification;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
}

const ResponseModal: React.FC<ModalProps> = ({ notification, onClose, onSend }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const header = `${notificationIcon(notification.type)} ${notificationLabel(notification.type, notification.senderName)}`;

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please write a message first.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await onSend(message);
      setSuccess('Message sent!');
      setTimeout(onClose, 1500);
    } catch {
      setError('Failed to send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div id="modalOverlay" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div id="modalCard" className="Modalcard">
        <p id="modalHeading" className="cardHeading">{header}</p>

        {isViewOnly(notification.type) && notification.content ? (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '12px 14px',
            margin: '12px 0',
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#111111'
          }}>
            {notification.content}
          </div>
        ) : (
          <p id="modalSubtext" className="cardSubtext">
            {notification.content || ''}
          </p>
        )}

        {!isViewOnly(notification.type) && (
          <div className="fieldGroup">
            <label className="label">
              {notification.type === 'birthday' ? 'Birthday Message' : 'Support Message'}
            </label>
            <textarea
              className="input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                notification.type === 'birthday'
                  ? 'Write a birthday message...'
                  : 'Write a support message...'
              }
              rows={4}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
        )}

        {error   && <p className="errorMsg" style={{ color: 'red'   }}>{error}</p>}
        {success && <p className="errorMsg" style={{ color: 'green' }}>{success}</p>}

        {!isViewOnly(notification.type) && (
          <button type="button" className="button" onClick={handleSend} disabled={sending}>
            {sending ? 'Sending...' : 'Send'}
          </button>
        )}

        <button type="button" className="backButton" onClick={onClose}>
          ← Close
        </button>
      </div>
    </div>
  );
};

// ── Notification Card ─────────────────────────────────────────────────

interface NotificationCardProps {
  notification: Notification;
  onClick: () => void;
  onFriendAction?: (action: 'accept' | 'decline') => void;
  friendResolved?: 'accept' | 'decline' | null;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onClick,
  onFriendAction,
  friendResolved
}) => (
  <div
    id={`notificationCard-${notification._id}`}
    className="Notifcard"
    onClick={onClick}
    style={{ cursor: 'pointer', marginBottom: '6px' }}
  >
    <div className="fieldRow" style={{ alignItems: 'center' }}>
      <p className="cardHeading" style={{ margin: 0 }}>
        {notificationIcon(notification.type)} {notificationLabel(notification.type, notification.senderName)}
        {!notification.isRead && (
          <span style={{ color: '#3b82f6', marginLeft: '6px' }}>●</span>
        )}
      </p>
    </div>

    {notification.type === 'friend_request' && !friendResolved && (
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <div className={styles.actionButtons}>
            <button
                className={styles.acceptBtn}
                onClick={(e) => {
                    e.stopPropagation();
                    //handleAccept(friendship._id);
                }}
            >Accept
            </button>
            <button
                className={styles.rejectBtn}
                onClick={(e) => {
                    e.stopPropagation();
                    //handleReject(friendship._id);
                }}
            >Decline
            </button>
        </div>
      </div>
    )}

    {notification.type === 'friend_request' && friendResolved && (
      <p style={{
        fontSize: '13px',
        marginTop: '6px',
        color: friendResolved === 'accept' ? 'green' : 'red'
      }}>
        {friendResolved === 'accept' ? 'Friend request accepted' : 'Friend request declined'}
      </p>
    )}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const [friendActions, setFriendActions] = useState<Record<string, 'accept' | 'decline'>>({});

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    await new Promise(res => setTimeout(res, 500));
    setNotifications(mockNotifications);
    setLoading(false);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
  };

  // API call for accept/decline goes here
  const handleFriendAction = (id: string, action: 'accept' | 'decline') => {
    markAsRead(id);
    setFriendActions(prev => ({ ...prev, [id]: action }));
  };

  const handleClick = (notification: Notification) => {
    if (notification.type === 'friend_request') return;
    markAsRead(notification._id);
    if (isRespondable(notification.type) || isViewOnly(notification.type)) {
      setActiveNotification(notification);
      return;
    }
    /*
    switch (notification.type) {
      case 'message':
        window.location.href = `/messages?conversation=${notification.relatedId}`;
        break;
    }
    */
  };

  const handleSendResponse = async (message: string) => {
    console.log('Mock send:', message);
    await new Promise(res => setTimeout(res, 800));
  };

  return (
    <div id="notificationsCard" className="card">
      <p id="notificationsHeading" className="cardHeading">Notifications</p>
      <p id="notificationsSubtext" className="cardSubtext">
        Stay up to date with your friends latest activity
      </p>

      {loading ? (
        <p className="cardSubtext">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="cardSubtext">No notifications yet.</p>
      )  : (
        <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
          {notifications.map(n => (
            <NotificationCard
              key={n._id}
              notification={n}
              onClick={() => handleClick(n)}
              onFriendAction={n.type === 'friend_request'
                ? (action) => handleFriendAction(n._id, action)
                : undefined
              }
              friendResolved={friendActions[n._id] ?? null}
            />
          ))}
        </div>
      )}

      {activeNotification && (
        <ResponseModal
          notification={activeNotification}
          onClose={() => setActiveNotification(null)}
          onSend={handleSendResponse}
        />
      )}
    </div>
  );
};

export default Notifications;