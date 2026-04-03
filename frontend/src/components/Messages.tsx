import React, { useState } from 'react';
import { buildPath } from './path';
import {retrieveToken, storeToken} from '../tokenStorage';

// Example of how the data might look coming from an API
const fakeConversations = [
    {
        _id: "conv_001",
        participants: ["user_123", "friend_456"], // objectId array
        lastMessageAt: "2026-04-03T10:30:00Z",   // date
        otherUserName: "Sarah Connor",           // Joined from Users table
        lastText: "See you at the resistance meeting!"
    },
    {
        _id: "conv_002",
        participants: ["user_123", "friend_789"],
        lastMessageAt: "2026-04-02T15:45:00Z",
        otherUserName: "John Doe",
        lastText: "Did you finish the ERD?"
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

    return (
        <div className="messagesContainer">

            <div className="conversationHeader">
                <input
                    type="text"
                    id="conversationSearch"
                    placeholder="Search"
                    autoFocus={true}
                    autoComplete="off"
                    autoCapitalize="off"
                />
            </div>

            <div className="conversations">
                {conversations.map((conv) => (
                    <div key={conv._id} className="conversationCard">
                        <div className="conversationAvatar">
                            {conv.otherUserName}
                        </div>
                        <div className="conversationDetails">
                            {conv.lastText}
                            <span className="timestamp">{formatTimeAgo(conv.lastMessageAt)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Messages;