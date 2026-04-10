import React, { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────

interface Notification {
  _id: string;
  recipientId: string;
  type:
    | 'friend_request'
    | 'message'
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
    _id: '2',
    recipientId: 'user1',
    type: 'message',
    content: 'Hey, just checking in! How are you?',
    createdAt: new Date(),
    isRead: false,
    relatedId: 'conv123',
    senderName: 'Sarah'
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
    case 'message':                 return '💬';
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
    case 'message':                 return `New message from ${senderName}`;
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

  //Send message API (birthday and support) 
  //Adds the written message to the senders notification group
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

        <p id="modalSubtext" className="cardSubtext">
          {notification.content || ''}
        </p>

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

const NotificationCard: React.FC<{ notification: Notification; onClick: () => void }> = ({
  notification,
  onClick
}) => (
  <div
    id={`notificationCard-${notification._id}`}
    className="Notifcard"
    onClick={onClick}
    style={{ cursor: 'pointer', marginBottom: '6px' }}
  >
    <div className="fieldRow" style={{ alignItems: 'center' }}>
      <div>
        <p className="cardHeading" style={{ margin: 0 }}>
            {notificationIcon(notification.type)} {notificationLabel(notification.type, notification.senderName)}
          {!notification.isRead && (
            <span style={{ color: '#3b82f6', marginLeft: '6px' }}>●</span>
          )}
        </p>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // API needed, fetch notifications
  const fetchNotifications = async () => {
    await new Promise(res => setTimeout(res, 500));
    setNotifications(mockNotifications);
    setLoading(false);
  };

  // API needed, mark read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleClick = (notification: Notification) => {
    markAsRead(notification._id);
    if (isRespondable(notification.type) || isViewOnly(notification.type)) {
      setActiveNotification(notification);
      return;
    }
    //Potential other locations to visit
    /*
    switch (notification.type) {
      case 'friend_request':
        window.location.href = `/friends?request=${notification.relatedId}`;
        break;
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
      ) : (
        notifications.map(n => (
          <NotificationCard
            key={n._id}
            notification={n}
            onClick={() => handleClick(n)}
          />
        ))
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
