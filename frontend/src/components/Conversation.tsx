import { buildPath } from './path';
import { retrieveToken, storeToken } from '../tokenStorage';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../pages/ConversationsPage.module.css';
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";

function Conversation() {
    const navigate = useNavigate();
    const { friendId } = useParams();
    const { state } = useLocation();

    const [conversations, setConversations] = useState<any[]>([]);
    const [message, setMessage] = useState('');
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    const lastFetchedFriend = useRef<string | undefined>(undefined);

    const _ud = localStorage.getItem('user_data');
    const ud = _ud ? JSON.parse(_ud) : { id: null };
    const userId = ud._id || ud.id;

    const friendFullName = state?.name || "Friend";

    const getConvId = useCallback(async (): Promise<string | null> => {
        if (!friendId) return null;
        if (state?.conversationId) return state.conversationId;

        try {
            const token = retrieveToken();
            const response = await fetch(buildPath('api/conversations'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ friendId: friendId })
            });
            const res = await response.json();
            return res.conversationId;
        } catch (e) {
            return null;
        }
    }, [friendId, state?.conversationId]);

    const loadConversations = useCallback(async (convId: string) => {
        setLoading(true);
        try {
            const token = retrieveToken();
            const response = await fetch(`${buildPath('api/messages')}?conversationID=${convId}&senderID=${userId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const res = await response.json();
            if (res.error) {
                setMessage(res.error);
            } else {
                setConversations(res.messages || []);
            }
            if (res.accessToken) storeToken({ accessToken: res.accessToken });
        } catch (error) {
            setMessage("Failed to load messages.");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const fetchRandomPrompt = useCallback(async () => {
        try {
            const token = retrieveToken();
            const response = await fetch(buildPath('api/return-random-prompt'), {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && data.prompt) {
                setPrompt(data.prompt.content || data.prompt.text || "No prompt today!");
            }
        } catch (error) {
            console.error("Prompt error:", error);
        }
    }, []);

    useEffect(() => {
        if (!_ud) {
            navigate('/');
            return;
        }

        if (lastFetchedFriend.current === friendId) return;
        lastFetchedFriend.current = friendId;

        setConversations([]);
        setMessage('');

        const token = retrieveToken();
        // Standardize the URL to the root for Socket.io
        const socketURL = buildPath("").split('/api')[0];
        const socket = io(socketURL, {
            auth: { token },
            transports: ['websocket']
        });
        socketRef.current = socket;

        const initializeChat = async () => {
            const convId = await getConvId();
            if (convId) {
                // FIXED: Join the room with the prefix to match api.js emit logic
                socket.emit('join:conversation', convId);
                loadConversations(convId);
            }
        };

        socket.on('connect', initializeChat);

        socket.on('message:new', (newMessage: any) => {
            setConversations((prev) => {
                const incomingId = newMessage._id || newMessage.id;
                if (prev.some(m => (m._id || m.id) === incomingId)) return prev;
                return [...prev, {
                    ...newMessage,
                    fromSender: (newMessage.senderId || newMessage.senderID) === userId
                }];
            });
        });

        fetchRandomPrompt();

        return () => {
            socket.off('connect');
            socket.off('message:new');
            socket.disconnect();
            socketRef.current = null;
        };
    }, [friendId, getConvId, loadConversations, fetchRandomPrompt, navigate, userId, _ud]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [conversations]);

    async function sendMessage(): Promise<void> {
        if (!inputText.trim()) return;
        try {
            const token = retrieveToken();
            const convId = await getConvId();
            const response = await fetch(buildPath('api/messages'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ senderID: userId, conversationID: convId, message: inputText })
            });
            const res = await response.json();

            // Note: api.js returns the created message in the 'message' key
            if (response.ok && res.message) {
                setConversations((prev) => [...prev, { ...res.message, fromSender: true }]);
                setInputText('');
            }
            if (res.accessToken) storeToken({ accessToken: res.accessToken });
        } catch (e) { console.error("Send error", e); }
    }

    return (
        <div className={styles.conversationView}>
            {loading ? (
                <div className={styles.loadingContainer}><p>Loading...</p></div>
            ) : message !== '' ? (
                <div className={styles.apiMessageContainer}>
                    <p className={styles.errorMessage}>{message}</p>
                    <button className={styles.retryButton} onClick={() => { setMessage(''); navigate(0); }}>Retry</button>
                </div>
            ) : (
                <>
                    <div className={styles.conversationHeader}>
                        <h1 className={styles.messageReceiverName}>{friendFullName}</h1>
                        <div className={styles.todaysPrompt}>
                            <p id={styles.promptHeader}>Today's Prompt</p>
                            <p id={styles.promptMessage}>{prompt}</p>
                        </div>
                    </div>
                    <div className={styles.messages} ref={scrollRef}>
                        {conversations.map((msg) => (
                            <div key={msg._id || msg.id} className={`${styles.conversationMessage} ${msg.fromSender ? styles.sent : styles.received}`}>
                                <p id={styles.conversationText}>{msg.text}</p>
                                <span className={styles.conversationTimestamp}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.messageInputWrapper}>
                        <input type="text" id={styles.messageInputText} placeholder="message" value={inputText}
                               onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
                        <button type="button" id={styles.messageInputButton} onClick={sendMessage} disabled={!inputText.trim()}>Send</button>
                    </div>
                </>
            )}
        </div>
    );
}

export default Conversation;