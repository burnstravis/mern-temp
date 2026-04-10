import {useEffect, useState} from 'react';
//import { buildPath } from './path';
//import { retrieveToken } from '../tokenStorage';
import styles from '../pages/MessagesPage.module.css'
import {useNavigate} from "react-router-dom";


const fakeConversations = [
    {
        _id: "conv_001",
        participants: ["user_123", "friend_456"],
        lastMessageAt: "2026-04-03T10:30:00Z",
        otherUserName: "Sarah",
        lastText: "See you at the teamteamteamteamteamteamteamteamteamteamteamteamteamteam meeting!"
    },
    {
        _id: "conv_002",
        participants: ["user_123", "friend_789"],
        lastMessageAt: "2026-04-02T15:45:00Z",
        otherUserName: "John",
        lastText: "Did you finish the project?"
    },
    {
        _id: "conv_003",
        participants: ["user_12345", "friend_7893123"],
        lastMessageAt: "2026-04-02T15:45:00Z",
        otherUserName: "BossMan",
        lastText: "where u at man"
    },
    {
        _id: "conv_004",
        participants: ["user_123222", "friend_789123"],
        lastMessageAt: "2026-04-02T15:45:00Z",
        otherUserName: "Bob",
        lastText: "Hows ur fish doing"
    }
];

function Messages() {

    const navigate = useNavigate();

    const [conversations, setConversations] = useState(fakeConversations);
    //const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    //const [message,setMessage] = useState('');

    const _ud = localStorage.getItem('user_data');

    if (!_ud) {
        navigate('/');
    }
    useEffect(() => {
        setConversations(fakeConversations);
    })

    // const ud = _ud ? JSON.parse(_ud) : { id: -1 };
    // const userId = ud._id || ud.id;

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diffInSeconds < 60) return 'now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
        return `${Math.floor(diffInSeconds / 604800)}w`;
    };

    // async function fetchConversation(){
    //     console.log("Pretend this opens the chat");
    //     setLoading(true);
    //
    //     try {
    //         const token = retrieveToken();
    //         const response = await fetch(buildPath('api/listConversations'), {
    //             method: 'POST',
    //             body: JSON.stringify({ userId: userId, jwtToken: token }),
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             }
    //         });
    //
    //         const res = await response.json();
    //
    //         if (res.error && res.error.length > 0) {
    //             setMessage("API Error: " + res.error);
    //             return;
    //         } else {
    //             setConversations(res.conversations || []);
    //         }
    //     } catch (e) {
    //         setMessage("Failed to load conversations" + e);
    //     } finally {
    //         setLoading(false);
    //     }
    // }

    async function loadConversation(_conversationId: string){

        console.log("Loading conversation...");

        console.log("Pretend this opens the chat");
    }

    async function createConversation(){
        console.log("Pretend this creates a new chat with a friend");

        // if (!searchText.trim()) return;
        //
        // const token = retrieveToken();
        // const obj = { userId: userId, recipientName: searchText, jwtToken: token };
        // const js = JSON.stringify(obj);
        //
        // try {
        //     const response = await fetch(buildPath('api/createConversation'), {
        //         method: 'POST',
        //         body: js,
        //         headers: { 'Content-Type': 'application/json' }
        //     });
        //
        //     const res = await response.json();
        //
        //     if (res.error && res.error.length > 0) {
        //         setResults("API Error: " + res.error);
        //         return;
        //     } else {
        //         setConversations([res.newConversation, ...conversations]);
        //         setSearchText("");
        //     }
        //
        //     if (res.accessToken) storeToken(res.accessToken);
        //
        //     const _results = res.results || [];
        //     setCardList(_results.join(', '));
        //     setResults('Card(s) have been retrieved');
        //
        // } catch (error: any) {
        //     setResults("Search failed: " + error.toString());
        // }
    }

    return (
        <div className={styles.allMessages}>

            <div className={styles.conversations}>

                <div className={styles.conversationHeader}>
                    <input
                        type="text"
                        id={styles.conversationSearch}
                        placeholder="Search username"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        autoFocus={true}
                        autoComplete="off"
                        autoCapitalize="off"
                    />

                    <button id={styles.addConversationButton} type="button" onClick={() => createConversation()}>Add</button>
                </div>


                {conversations.map((conv) => (
                    <div key={conv._id} className={styles.conversationCard} onClick={() => loadConversation(conv._id)}>
                        <div className={styles.conversationAvatar}>
                            {conv.otherUserName}
                        </div>
                        <div className={styles.conversationDetails}>
                            <span className={styles.lastText}>
                                {conv.lastText}
                            </span>
                            <span className={styles.timestamp}>
                                {formatTimeAgo(conv.lastMessageAt)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Messages;