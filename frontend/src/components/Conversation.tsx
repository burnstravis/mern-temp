import { buildPath } from './path';
import {retrieveToken, storeToken} from '../tokenStorage';
import  {useEffect, useState} from 'react';
import styles from '../pages/ConversationsPage.module.css'
import {useLocation, useNavigate, useParams} from "react-router-dom";

const conversationWithFriend1 = [
    {
        _id: "m101",
        conversationId: "conv_alpha",
        senderId: "69d4944bdc68a7a71ca1c6e3", // Them
        text: "Did you finish that report yet?",
        createdAt: "2026-04-13T10:00:00Z"
    },
    {
        _id: "m102",
        conversationId: "conv_alpha",
        senderId: "69d48e049063fbc48903272f", // Me
        text: "Almost! Just need to fix the charts. Why, you heading out early?",
        createdAt: "2026-04-13T10:05:00Z"
    },
    {
        _id: "m103",
        conversationId: "conv_alpha",
        senderId: "69d4944bdc68a7a71ca1c6e3", // Them
        text: "Yeah, thinking of hitting that new taco spot. Interested?",
        createdAt: "2026-04-13T10:06:20Z"
    },
    {
        _id: "m104",
        conversationId: "conv_alpha",
        senderId: "69d48e049063fbc48903272f", // Me
        text: "Tacos? Say no more. I'll be done in 20.",
        createdAt: "2026-04-13T10:07:45Z"
    }
];

const conversationWithFriend2 = [
    {
        _id: "m201",
        conversationId: "conv_beta",
        senderId: "69d48e049063fbc48903272f", // Me
        text: "Saw today's prompt. I'd definitely just hide people's car keys 5 minutes before they leave.",
        createdAt: "2026-04-14T08:30:00Z"
    },
    {
        _id: "m202",
        conversationId: "conv_beta",
        senderId: "69dc31b1435eea372fed382c", // Them
        text: "That is evil. I'd just slightly unscrew every lightbulb in the house.",
        createdAt: "2026-04-14T08:32:15Z"
    },
    {
        _id: "m203",
        conversationId: "conv_beta",
        senderId: "69d48e049063fbc48903272f", // Me
        text: "Classic. Or just stand behind them and whisper 'is it cold in here?'",
        createdAt: "2026-04-14T08:33:50Z"
    }
];


function Conversation() {

    const navigate = useNavigate();
    const { friendId } = useParams();
    const { state } = useLocation();

    const conversation = (friendId == "69d4944bdc68a7a71ca1c6e3") ? conversationWithFriend1 : conversationWithFriend2;

    const [conversations, setConversations] = useState<any[]>([]);
    const [message, setMessage] =  useState('');
    const [loading, setLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    //const [text, setText] = useState('');

    const _ud = localStorage.getItem('user_data');
    const ud = _ud ? JSON.parse(_ud) : { id: null };
    const userId = ud._id || ud.id;

    const displayName = state?.name || "Friend";

    useEffect(() => {
        if (!_ud) {
            navigate('/');
        }
        else{
            try {
                loadConversations()
            } catch (e){
                console.log("loadConversations error: ", e);
            } finally {
                setConversations(conversation); //temp hard coded
            }
            //loadConversations(); //when api exists
        }

    }, [navigate, _ud, friendId, isSending]);

    async function fetchConversationId() :Promise<string>{
        //get onversation id where participants include user and friend id

        return "some conversation id";
    }

    async function loadConversations()
    {
        setLoading(true);
        try {
            if(!userId) return;

            const convId = fetchConversationId();
            const token = retrieveToken();
            const queryParams = new URLSearchParams({
                    conversationId: convId.toString()
            });

            const response = await fetch(`${buildPath('api/messages')}?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const res = await response.json();

            if (res.error && res.error.length > 0) {
                setMessage("API Error: " + res.error);
                return;
            } else {
                setConversations(res.conversations || []);
            }

            if (res.jwtToken) storeToken({accessToken: res.jwtToken});

        } catch (error: any) {
            console.error(error);
            setMessage("Failed to load conversations." + error.toString());
        } finally {
            setLoading(false);
        }
    }

    async function sendMessage(): Promise<void> {
        setIsSending(true);
        setIsSending(false);
        return;
    }


    return (
        <div className={styles.conversationView}>

            {loading ? (
                <div>
                    <p>Loading...</p>
                    <div>{message}</div>
                </div>
                ) : (
                <>
                <div className={styles.conversationHeader}>
                    <h1 className={styles.messageReceiverName}>{displayName}</h1>
                    <div className={styles.todaysPrompt}>
                        <p id={styles.promptHeader}>Today's Prompt</p>
                        <p id={styles.promptMessage}>"if you were a ghost, how would you mildly inconvenience people?"</p>
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
                    <button type="button" id={styles.messageInputButton} onClick={sendMessage}>Send</button>
                </div>
                </>
                )
            }

        </div>
    );
};
export default Conversation;