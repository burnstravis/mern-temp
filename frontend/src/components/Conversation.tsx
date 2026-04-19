import { buildPath } from './path';
import { retrieveToken, storeToken } from '../tokenStorage';
import {useCallback, useEffect, useRef, useState} from 'react';
import styles from '../pages/ConversationsPage.module.css'
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";


function Conversation() {
    const navigate = useNavigate();
    const { friendId } = useParams();
    const { state } = useLocation();

    const hasFetched = useRef(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [message, setMessage] = useState('');
    const [inputText, setInputText] = useState(''); // Track typing
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null); // Create the ref
    const socketRef = useRef<Socket | null>(null); // To store the socket instance

    const _ud = localStorage.getItem('user_data');
    const ud = _ud ? JSON.parse(_ud) : { id: null };
    const userId = ud._id || ud.id;

    const friendFullName = state.name;

    async function getConvId(): Promise<string | null> {
        if (state?.conversationId) return state.conversationId;

        try {
            const token = retrieveToken();
            const response = await fetch(buildPath('api/conversations'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ friendId })
            });
            const res = await response.json();
            return res.conversationId;
        } catch (e) {
            return null;
        }
    }

    async function loadConversations() {
        setLoading(true);
        try {
            const convId = await getConvId();
            const token = retrieveToken();

            const response = await fetch(`${buildPath('api/messages')}?conversationID=${convId}&senderID=${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const res = await response.json();
            if (res.error) {
                setMessage(res.error);
            } else {
                setConversations(res.messages || []);
            }

            if (res.accessToken) storeToken({ accessToken: res.accessToken });
        } catch (error: any) {
            setMessage("Failed to load messages.");
        } finally {
            setLoading(false);
        }
    }

    async function sendMessage(): Promise<void> {
        if (!inputText.trim()) return;

        try {
            const token = retrieveToken();
            const convId = await getConvId();

            const response = await fetch(buildPath('api/messages'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    senderID: userId,
                    conversationID: convId,
                    message: inputText
                })
            });

            const res = await response.json();
            if (res.accessToken) storeToken({ accessToken: res.accessToken });

            setInputText('');
        } catch (e) {
            console.error("Send error", e);
        }
    }

    const fetchRandomPrompt = useCallback(async () => {
        try {
            const token = retrieveToken();
            const response = await fetch(buildPath('api/return-random-prompt'), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok && data.prompt) {
                const promptText = data.prompt.content || data.prompt.text || "No prompt today!";
                setPrompt(promptText);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    }, []);

    useEffect(() => {
        if (!_ud) {
            navigate('/');
            return;
        }

        // Single source of truth for loading
        loadConversations();
        if(hasFetched.current) return;
        hasFetched.current = true;

        loadConversations();
        fetchRandomPrompt();

        const token = retrieveToken();
        socketRef.current = io(buildPath(""), {
            auth: { token }
        });

        const setupSocket = async () => {
            const convId = await getConvId();
            if (convId && socketRef.current) {
                socketRef.current.emit('join:conversation', convId);

                socketRef.current.on('message:new', (newMessage: any) => {
                    setConversations((prev) => {
                        if (prev.find(m => m._id === newMessage._id)) return prev;
                        return [...prev, {
                            ...newMessage,
                            fromSender: newMessage.senderId === userId
                        }];
                    });
                });
            }
        };

        setupSocket();

        return () => {
            socketRef.current?.off('message:new'); // Clean up listener
            socketRef.current?.disconnect();
            hasFetched.current = false;
        };
    }, [friendId]);


    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [conversations, loading]);


    return (
        <div className={styles.conversationView}>
            {loading ? (
                <div className={styles.loadingContainer}>
                    <p>Loading...</p>
                </div>
            ) : message !== '' ? (
                <div className={styles.apiMessageContainer}>
                    <p className={styles.errorMessage}>{message}</p>
                    <button
                        className={styles.retryButton}
                        onClick={() => { setMessage(''); loadConversations(); }}
                    >
                        Go Back to Chat
                    </button>
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
                            <div
                                key={msg._id}
                                className={`${styles.conversationMessage} ${msg.fromSender ? styles.sent : styles.received}`}
                            >
                                <p id={styles.conversationText}>{msg.text}</p>
                                <span className={styles.conversationTimestamp}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.messageInputWrapper}>
                        <input
                            type="text"
                            id={styles.messageInputText}
                            placeholder="message"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button
                            type="button"
                            id={styles.messageInputButton}
                            onClick={sendMessage}
                            disabled={!inputText.trim()}
                        >
                            Send
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}



export default Conversation;