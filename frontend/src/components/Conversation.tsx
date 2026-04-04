import React, { useState } from 'react';
import { buildPath } from './path';
import {retrieveToken, storeToken} from '../tokenStorage';
import styles from '../pages/ConversationsPage.module.css'

const fakeMessages = [
    {
        _id: "m1",
        conversationId: "conv_001",
        senderId: "69cc1a6778e6bd166a893917",
        text: "Yo random question",
        createdAt: "2026-04-02T21:50:00Z"
    },
    {
        _id: "m2",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "This already sounds dangerous",
        createdAt: "2026-04-02T21:52:00Z"
    },
    {
        _id: "m3",
        conversationId: "conv_001",
        senderId: "69cc1a6778e6bd166a893917",
        text: "Would you rather fight 1 horse-sized duck or 100 duck-sized horses",
        createdAt: "2026-04-02T21:53:30Z"
    },
    {
        _id: "m4",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "100 duck-sized horses easy",
        createdAt: "2026-04-02T21:54:10Z"
    },
    {
        _id: "m5",
        conversationId: "conv_001",
        senderId: "69cc1a6778e6bd166a893917",
        text: "Nah you're underestimating the swarm",
        createdAt: "2026-04-02T21:55:00Z"
    },
    {
        _id: "m6",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Bro it's tiny horses, just start kicking",
        createdAt: "2026-04-02T21:55:45Z"
    },
    {
        _id: "m7",
        conversationId: "conv_001",
        senderId: "69cc1a6778e6bd166a893917",
        text: "You think you'd win against 100 of anything??",
        createdAt: "2026-04-02T21:56:30Z"
    },
    {
        _id: "m8",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Confidence is key",
        createdAt: "2026-04-02T21:57:05Z"
    },
    {
        _id: "m9",
        conversationId: "conv_001",
        senderId: "69cc1a6778e6bd166a893917",
        text: "That horse-sized duck is terrifying though",
        createdAt: "2026-04-02T21:58:10Z"
    },
    {
        _id: "m10",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Yeah one bite and it's over",
        createdAt: "2026-04-02T21:59:00Z"
    },
    {
        _id: "m11",
        conversationId: "conv_001",
        senderId: "69cc1a6778e6bd166a893917",
        text: "Exactly. At least with the small ones you have a chance",
        createdAt: "2026-04-02T22:00:15Z"
    },
    {
        _id: "m12",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Also imagine explaining you lost to a giant duck",
        createdAt: "2026-04-02T22:01:00Z"
    },
    {
        _id: "m13",
        conversationId: "conv_001",
        senderId: "69cc1a6778e6bd166a893917",
        text: "Honestly that's the worst part",
        createdAt: "2026-04-02T22:02:20Z"
    },
    {
        _id: "m14",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Alright new question",
        createdAt: "2026-04-02T22:03:00Z"
    },
    {
        _id: "m15",
        conversationId: "conv_001",
        senderId: "69cc1a6778e6bd166a893917",
        text: "Go ahead",
        createdAt: "2026-04-02T22:04:10Z"
    },
    {
        _id: "m16",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "If animals could talk which one would be the most annoying",
        createdAt: "2026-04-02T22:05:00Z"
    },
    {
        _id: "m17",
        conversationId: "conv_001",
        senderId: "69cc1a6778e6bd166a893917",
        text: "Seagulls and it's not even close",
        createdAt: "2026-04-02T22:05:45Z"
    },
    {
        _id: "m18",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "They'd just yell 'MINE' at everything",
        createdAt: "2026-04-02T22:06:20Z"
    },
    {
        _id: "m19",
        conversationId: "conv_001",
        senderId: "69cc1a6778e6bd166a893917",
        text: "And steal your food while trash talking you",
        createdAt: "2026-04-02T22:07:05Z"
    },
    {
        _id: "m20",
        conversationId: "conv_001",
        senderId: "69cef5e1e3ca7a5c4f11f4d4",
        text: "Yeah I'd never go outside again",
        createdAt: "2026-04-02T22:08:00Z"
    },
    {
        _id: "m21",
        conversationId: "conv_001",
        senderId: "69cc1a6778e6bd166a893917",
        text: "Same honestly 😂",
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
        <div className={styles.conversationView}>
            <div className={styles.conversationHeader}>
                <h1 className={styles.messageReceiverName}>Bob</h1>
                <div className={styles.todaysPrompt}>
                    <p id={styles.promptHeader}>Today's Prompt</p>
                    <p id={styles.promptMessage}>"if you were a ghost, how would you mildly inconvenienceinconvenience people?"</p>
                </div>
            </div>

            <div className={styles.messages}>
                {conversations.map((msg) => {
                    const isMe = msg.senderId === userId;
                    return (
                        <div key={msg._id}
                             className={`${styles.conversationMessage} ${isMe ? styles.sent : styles.received}`}>
                            <p id={styles.conversationText}>{msg.text}</p>
                            <span className={styles.conversationTimestamp}>
                                {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className={styles.messageInputWrapper}>
                <input type="text" id={styles.messageInputText} placeholder="message" />
                <button type="button" id={styles.messageInputButton}>Send</button>
            </div>
        </div>
    );
};
export default Conversation;