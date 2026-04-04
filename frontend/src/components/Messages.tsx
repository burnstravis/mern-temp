import React, { useState } from 'react';
import { buildPath } from './path';
import {retrieveToken, storeToken} from '../tokenStorage';
import styles from '../pages/MessagesPage.module.css'


const fakeConversations = [
    {
        _id: "conv_001",
        participants: ["user_123", "friend_456"],
        lastMessageAt: "2026-04-03T10:30:00Z",
        otherUserName: "Sarah",
        lastText: "See you at the team meeting!"
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
        _id: "conv_002",
        participants: ["user_123222", "friend_789123"],
        lastMessageAt: "2026-04-02T15:45:00Z",
        otherUserName: "Bob",
        lastText: "Hows ur fish doing"
    }
];

function Messages() {

    const [conversations, setConversations] = React.useState(fakeConversations);


    const _ud = localStorage.getItem('user_data');

    if (!_ud) {
        window.location.href = "/";
    }
    const ud = _ud ? JSON.parse(_ud) : { id: -1 };
    const userId = ud._id || ud.id;

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

    async function loadConversation(){
        console.log("Pretend this opens the chat");
    }

    return (
        <div className={styles.allMessages}>

            <div className={styles.conversationHeader}>
                <input
                    type="text"
                    id={styles.conversationSearch}
                    placeholder="Search"
                    autoFocus={true}
                    autoComplete="off"
                    autoCapitalize="off"
                />
            </div>

            <div className={styles.conversations}>
                {conversations.map((conv) => (
                    <div key={conv._id} className={styles.conversationCard} onClick={loadConversation}>
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