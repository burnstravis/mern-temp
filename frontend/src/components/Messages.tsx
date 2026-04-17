import { useEffect, useState } from 'react';
import { buildPath } from './path';
import { retrieveToken, storeToken } from '../tokenStorage';
import styles from '../pages/MessagesPage.module.css';
import { useNavigate } from "react-router-dom";

function Messages() {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState<any[]>([]);
    const [filteredList, setFilteredList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [message, setMessage] = useState('');

    const _ud = localStorage.getItem('user_data');
    const ud = _ud ? JSON.parse(_ud) : null;
    const userId = ud?.id || ud?._id;

    useEffect(() => {
        if (!_ud) {
            navigate('/');
        } else {
            fetchConversations();
        }
    }, [navigate, _ud]);

    const formatTimeAgo = (dateString: string) => {
        if (!dateString) return '';
        const now = new Date();
        const past = new Date(dateString);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diffInSeconds < 60) return 'now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        return `${Math.floor(diffInSeconds / 86400)}d`;
    };

    async function fetchConversations() {
        setLoading(true);
        try {
            const token = retrieveToken();
            const response = await fetch(buildPath('api/conversations'), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const res = await response.json();

            if (res.error) {
                setMessage(res.error);
            } else {
                setConversations(res.conversations || []);
                setFilteredList(res.conversations || []);
                if (res.accessToken) storeToken({ accessToken: res.accessToken });
            }
        } catch (e) {
            setMessage("Failed to load conversations");
        } finally {
            setLoading(false);
        }
    }

    function loadConversation(conv: any) {
        console.log(conv.otherUser);
        const friendId = conv.participants.find((p: string) => p !== userId);
        navigate(`/conversation/${friendId}`, {
            state: { name: `${conv.otherUser.firstName} ${conv.otherUser.lastName}`  || "Friend" }
        });
    }

    const handleSearch = () => {
        if (!searchText.trim()) {
            setFilteredList(conversations);
            return;
        }

        const matches = conversations.filter(conv =>
            conv.otherUser.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
            conv.otherUser.lastName?.toLowerCase().includes(searchText.toLowerCase())
        );

        setFilteredList(matches);
    };

    return (
        <div className={styles.allMessages}>

            <h1 className={styles.messagesHeader}>Messages</h1>

            <div className={styles.conversations}>
                <div className={styles.conversationHeader}>
                    <input
                        type="text"
                        id={styles.conversationSearch}
                        placeholder="Search chats..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <button id={styles.searchConversationButton} onClick={handleSearch}>find</button>
                </div>

                {loading && <p>Loading chats...</p>}

                {filteredList.map((conv) => (
                    <div key={conv._id} className={styles.conversationCard} onClick={() => loadConversation(conv)}>
                        <div className={styles.conversationAvatar}>
                            {conv.otherUser.firstName} {conv.otherUser.lastName}
                        </div>
                        <div className={styles.conversationDetails}>
                            <div className={styles.lastText}>
                                {conv.lastMessage || "No messages yet"}
                            </div>
                            <span className={styles.timestamp}>
                                {formatTimeAgo(conv.lastMessageAt)}

                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <p>{message}</p>
        </div>
    );
}

export default Messages;