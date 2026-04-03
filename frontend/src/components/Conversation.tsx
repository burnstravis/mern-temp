import React, { useState } from 'react';
import { buildPath } from './path';
import {retrieveToken, storeToken} from '../tokenStorage';

const fakeMessages = [
    {
        _id: "m1",
        conversationId: "conv_001",
        senderId: "64f1a2b3c4d5e6f7g8h9i0j2",
        text: "Yo what are you doing right now",
        createdAt: "2026-04-02T21:50:00Z"
    },
    {
        _id: "m2",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Nothing much, just eating breakfast lol",
        createdAt: "2026-04-02T21:52:00Z"
    },
    {
        _id: "m3",
        conversationId: "conv_001",
        senderId: "64f1a2b3c4d5e6f7g8h9i0j2",
        text: "Breakfast at 5pm is crazy",
        createdAt: "2026-04-02T21:53:30Z"
    },
    {
        _id: "m4",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Don’t judge me, my sleep schedule is cooked",
        createdAt: "2026-04-02T21:54:10Z"
    },
    {
        _id: "m5",
        conversationId: "conv_001",
        senderId: "64f1a2b3c4d5e6f7g8h9i0j2",
        text: "Same tbh. I stayed up till like 4 finishing stuff",
        createdAt: "2026-04-02T21:55:00Z"
    },
    {
        _id: "m6",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Working on that project still?",
        createdAt: "2026-04-02T21:55:45Z"
    },
    {
        _id: "m7",
        conversationId: "conv_001",
        senderId: "64f1a2b3c4d5e6f7g8h9i0j2",
        text: "Yeah the MLB one, trying to optimize the backend. It’s kinda slow rn",
        createdAt: "2026-04-02T21:56:30Z"
    },
    {
        _id: "m8",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Didn’t you already add threading to that?",
        createdAt: "2026-04-02T21:57:05Z"
    },
    {
        _id: "m9",
        conversationId: "conv_001",
        senderId: "64f1a2b3c4d5e6f7g8h9i0j2",
        text: "Yeah but it’s kinda overkill on my server, I think I need to batch stuff better",
        createdAt: "2026-04-02T21:58:10Z"
    },
    {
        _id: "m10",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Makes sense. Are you using MySQL for it?",
        createdAt: "2026-04-02T21:59:00Z"
    },
    {
        _id: "m11",
        conversationId: "conv_001",
        senderId: "64f1a2b3c4d5e6f7g8h9i0j2",
        text: "Yeah MariaDB actually. Inserts are the slow part",
        createdAt: "2026-04-02T22:00:15Z"
    },
    {
        _id: "m12",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "You should do bulk inserts instead of one per player",
        createdAt: "2026-04-02T22:01:00Z"
    },
    {
        _id: "m13",
        conversationId: "conv_001",
        senderId: "64f1a2b3c4d5e6f7g8h9i0j2",
        text: "Yeah that’s what I’m thinking. Probably gonna refactor that next",
        createdAt: "2026-04-02T22:02:20Z"
    },
    {
        _id: "m14",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Nice. Anyway you tryna do something later?",
        createdAt: "2026-04-02T22:03:00Z"
    },
    {
        _id: "m15",
        conversationId: "conv_001",
        senderId: "64f1a2b3c4d5e6f7g8h9i0j2",
        text: "Yeah I’m down. What were you thinking?",
        createdAt: "2026-04-02T22:04:10Z"
    },
    {
        _id: "m16",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Maybe hop on a game or something, or we could go get food",
        createdAt: "2026-04-02T22:05:00Z"
    },
    {
        _id: "m17",
        conversationId: "conv_001",
        senderId: "64f1a2b3c4d5e6f7g8h9i0j2",
        text: "I’m kinda hungry not gonna lie",
        createdAt: "2026-04-02T22:05:45Z"
    },
    {
        _id: "m18",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Same. Want to grab something around like 7?",
        createdAt: "2026-04-02T22:06:20Z"
    },
    {
        _id: "m19",
        conversationId: "conv_001",
        senderId: "64f1a2b3c4d5e6f7g8h9i0j2",
        text: "Yeah that works. I just need to finish a couple things first",
        createdAt: "2026-04-02T22:07:05Z"
    },
    {
        _id: "m20",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Bet just text me when you’re ready",
        createdAt: "2026-04-02T22:08:00Z"
    },
    {
        _id: "m21",
        conversationId: "conv_001",
        senderId: "64f1a2b3c4d5e6f7g8h9i0j2",
        text: "Will do 👍",
        createdAt: "2026-04-02T22:08:30Z"
    }
];

function Conversation() {

    const [conversations, setConversations] = React.useState(fakeMessages);
    const [message, setMessage] =  useState('');


    const _ud = localStorage.getItem('user_data');

    if (!_ud) {
        window.location.href = "/";
    }
    const ud = _ud ? JSON.parse(_ud) : { id: -1 };
    const userId = ud._id || ud.id;

    // async function loadConversations()
    // {
    //
    //     const token = retrieveToken();
    //     const obj = { userId: userId, jwtToken: token };
    //     const js = JSON.stringify(obj);
    //     if(!userId) return;
    //
    //     try {
    //         const response = await fetch(buildPath(`api/conversations`), {
    //             method: 'POST',
    //             body: js,
    //             headers: { 'Content-Type': 'application/json' }
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
    //
    //         if (res.jwtToken) storeToken({accessToken: res.jwtToken});
    //
    //     } catch (error: any) {
    //         console.error(error);
    //         setMessage("Failed to load conversations." + error.toString());
    //     }
    // }

    //loadConversations();

    return (
        <div className="conversationContainer">
            <div className="conversationHeader">
                <h1 className="messageReceiverName">Bob</h1>
                <div className="todaysPrompt">
                    <p id="promptHeader">Today's Prompt</p>
                    <p id="promptMessage">"if you were a ghost, how would you mildly inconvenience people?"</p>
                </div>
            </div>
            <div className="messages">
                {conversations.map((msg) => {
                    const isMe = msg.senderId === userId;
                    return (
                        <div key={msg._id} className={`conversationMessage ${isMe ? 'sent' : 'received'}`}>
                            <p id="conversationText">{msg.text}</p>
                            <span className="conversationTimestamp">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        </div>
                    );
                })}
            </div>

            <div className="messageInputWrapper">
                    <input
                        type="text"
                        id="messageInputText"
                        placeholder="message"
                        autoFocus={true}
                        autoComplete="on"
                        autoCapitalize="on"
                    />
                    <button type="button" id="messageInputButton">Send</button>
            </div>
        </div>
    );
};
export default Conversation;