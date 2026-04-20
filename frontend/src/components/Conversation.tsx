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
    const [isGeneratingReply, setIsGeneratingReply] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [friendBirthdayToday, setFriendBirthdayToday] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    //const lastFetchedFriend = useRef<string | undefined>(undefined);

    const _ud = localStorage.getItem('user_data');
    const ud = _ud ? JSON.parse(_ud) : { id: null };
    // MongoDB _id can be a string or object depending on your local storage
    const userId = (ud._id || ud.id)?.toString();

    const friendFullName = state?.name || "Friend";

    const extractBirthdayParts = (birthday?: string): { month: number; day: number } | null => {
        if (!birthday) return null;

        const normalizedBirthday = birthday.trim().split('T')[0];
        const yearMonthDayMatch = normalizedBirthday.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (yearMonthDayMatch) {
            return {
                month: Number(yearMonthDayMatch[2]) - 1,
                day: Number(yearMonthDayMatch[3])
            };
        }

        const monthDayYearMatch = normalizedBirthday.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
        if (monthDayYearMatch) {
            return {
                month: Number(monthDayYearMatch[1]) - 1,
                day: Number(monthDayYearMatch[2])
            };
        }

        const parsedBirthday = new Date(normalizedBirthday);
        if (Number.isNaN(parsedBirthday.getTime())) return null;

        return {
            month: parsedBirthday.getUTCMonth(),
            day: parsedBirthday.getUTCDate()
        };
    };

    const isBirthdayToday = (birthday?: string): boolean => {
        const birthdayParts = extractBirthdayParts(birthday);
        if (!birthdayParts) return false;

        const today = new Date();
        return birthdayParts.month === today.getMonth() && birthdayParts.day === today.getDate();
    };

    const formatBirthdayLabel = (birthday?: string): string => {
        const birthdayParts = extractBirthdayParts(birthday);
        if (!birthdayParts) return '';

        const birthdayDate = new Date(Date.UTC(2000, birthdayParts.month, birthdayParts.day));
        return birthdayDate.toLocaleDateString([], { month: 'long', day: 'numeric' });
    };

    const loadFriendProfile = useCallback(async () => {
        if (!friendId) return;

        try {
            const token = retrieveToken();
            const response = await fetch(buildPath(`api/friend-profile/${friendId}`), {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const res = await response.json();

            if (response.ok && res.friend) {
                setFriendBirthdayToday(isBirthdayToday(res.friend.birthday));
            } else {
                setFriendBirthdayToday(false);
            }

            if (res.accessToken) storeToken({ accessToken: res.accessToken });
        } catch {
            setFriendBirthdayToday(false);
        }
    }, [friendId]);

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
                // Ensure every message is checked against the current userId
                const tagged = (res.messages || []).map((m: any) => ({
                    ...m,
                    fromSender: m.senderId?.toString() === userId
                }));
                setConversations(tagged);
            }
            if (res.accessToken) storeToken({ accessToken: res.accessToken });
        } catch (error) {
            setMessage("Failed to load messages.");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const fetchRandomPrompt = useCallback(async (conversationId: string) => {
        try {
            const token = retrieveToken();
            const response = await fetch(`${buildPath('api/return-random-prompt')}?conversationId=${conversationId}`, {
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

        // Prevents redundant connections if the component re-renders
        if (socketRef.current?.connected) return;

        const token = retrieveToken();

        const socketURL = 'https://largeproject.nathanfoss.me';

        const socket = io(socketURL, {
            auth: { token: `Bearer ${token}` },
            transports: ['websocket'],
            // Helps avoid issues with rapid mount/unmount in Dev
            reconnection: true,
            reconnectionAttempts: 5
        });

        socketRef.current = socket;

        socket.on('connect', async () => {
            console.log("Connected to Socket on 3000");
            const convId = await getConvId();
            if (convId) {
                // Send raw ID, server adds "conversation:" prefix
                socket.emit('join:conversation', convId);
                loadConversations(convId);
                console.log("loading conversations");
            }
        });

        socket.on('message:new', (newMessage) => {
            setConversations((prev) => {
                const incomingId = (newMessage._id || newMessage.id)?.toString();

                // Check against IDs
                if (prev.some(m => (m._id || m.id)?.toString() === incomingId)) {
                    return prev;
                }

                // ADDITIONAL CHECK: If the ID is missing (temp message) check text/sender/time
                // This prevents double-rendering if the socket is faster than the HTTP response
                if (prev.some(m => m.text === newMessage.text &&
                    m.senderId === newMessage.senderId &&
                    Math.abs(new Date(m.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 2000)) {
                    return prev;
                }

                return [...prev, {
                    ...newMessage,
                    fromSender: newMessage.senderId?.toString() === userId
                }];
            });
        });

        return () => {
            // Only disconnect if we are actually unmounting for real
            if (socketRef.current) {
                socket.off('connect');
                socket.off('message:new');
                socket.disconnect();
                socketRef.current = null;
            }
        };
    }, [friendId, userId, getConvId, loadConversations, fetchRandomPrompt]); // Keep dependencies minimal

    useEffect(() => {
        loadFriendProfile();
    }, [loadFriendProfile]);

    useEffect(() => {
        let isMounted = true;

        const loadPrompt = async () => {
            const convId = await getConvId();
            if (!convId || !isMounted) return;
            fetchRandomPrompt(convId);
        };

        loadPrompt();

        return () => {
            isMounted = false;
        };
    }, [getConvId, fetchRandomPrompt]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [conversations]);

    async function sendMessage(): Promise<void> {
        if (!inputText.trim()) return;
        const textToSend = inputText;
        setInputText(''); // Clear UI immediately for "snappiness"

        try {
            const token = retrieveToken();
            const convId = await getConvId();
            const response = await fetch(buildPath('api/messages'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    senderID: userId,
                    conversationID: convId,
                    message: textToSend
                })
            });

            const res = await response.json();
            // REMOVE: setConversations((prev) => [...prev, res.message]);
            // The socket listener below will handle adding this for you.

            if (res.accessToken) storeToken({ accessToken: res.accessToken });
        } catch (e) {
            console.error("Send error", e);
            setInputText(textToSend); // Put text back if send failed
        }
    }

    async function generateSmartReply(): Promise<void> {
        if (isGeneratingReply) return;

        setIsGeneratingReply(true);

        try {
            const token = retrieveToken();
            const convId = await getConvId();

            if (!convId) {
                setMessage('Unable to generate smart reply: conversation not found.');
                return;
            }

            const response = await fetch(buildPath(`api/conversations/${convId}/smart-reply`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const res = await response.json();

            if (res.accessToken) {
                storeToken({ accessToken: res.accessToken });
            }

            if (res.error) {
                setMessage(res.error);
                return;
            }

            if (res.suggestion) {
                setInputText(res.suggestion);
            }
        } catch (e) {
            setMessage('Failed to generate smart reply.');
        } finally {
            setIsGeneratingReply(false);
        }
    }

    const birthdayLabel = formatBirthdayLabel((state as any)?.birthday);

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
                        {friendBirthdayToday && (
                            <div className={styles.birthdayBadge} title={birthdayLabel ? `Birthday: ${birthdayLabel}` : 'Birthday today'}>
                                🎂 Birthday today
                            </div>
                        )}
                        <div className={styles.todaysPrompt}>
                            <p id={styles.promptHeader}>Today's Prompt</p>
                            <p id={styles.promptMessage}>{prompt}</p>
                        </div>
                    </div>
                    <div className={styles.messages} ref={scrollRef}>
                        {conversations.map((msg) => (
                            <div
                                key={msg._id || msg.id}
                                className={`${styles.conversationMessage} ${msg.fromSender ? styles.sent : styles.received}`}
                            >
                                <p id={styles.conversationText}>{msg.text}</p>
                                <span className={styles.conversationTimestamp}>
                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.messageInputWrapper}>
                        <button
                            type="button"
                            className={styles.smartReplyButton}
                            onClick={generateSmartReply}
                            disabled={isGeneratingReply}
                        >
                            Smart Reply
                        </button>
                        <input type="text" id={styles.messageInputText} placeholder="message" value={inputText}
                               onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
                        <button type="button" id={styles.messageInputButton} onClick={sendMessage} disabled={!inputText.trim()}>Send</button>
                    </div>
                    {isGeneratingReply ? (
                        <div className={styles.generatingRow}>
                            <span className={styles.generatingSpinner} aria-hidden="true" />
                            <span className={styles.generatingText}>generating...</span>
                        </div>
                    ) : null}
                </>
            )}
        </div>
    );
}

export default Conversation;