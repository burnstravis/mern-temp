import { useNavigate } from 'react-router-dom';
import styles from '../pages/SupportPage.module.css'
import {useEffect, useState} from "react";
import {buildPath} from "./path.ts";
import {retrieveToken} from "../tokenStorage.ts";

const Support = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState('');
    const [type, setType] = useState('Encouragement');

    const _ud = localStorage.getItem('user_data');
    const ud = _ud ? JSON.parse(_ud) : {id: null};
    const name = ud.firstName.toString().charAt(0).toUpperCase() + ud.firstName.toString().slice(1) || "";

    useEffect(() => {
        if (!_ud) {
            navigate('/');
        }
    }, [navigate, _ud]);

    async function sendSupportRequest() {
        const token = retrieveToken();

        try {
            const response = await fetch(buildPath('api/support-requests'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({content, type})
            });

            const res = await response.json();
            if (res.requestId) {
                alert("Your request has been sent to all your friends!");
                setContent('');
            }
        } catch (e) {
            console.error("Support Request failed", e);
        }
    }

    return (
        <div className={styles.supportWrapper}>
            <h1 className={styles.supportTitle}>Request Support</h1>
            <div className={styles.supportContainer}>
                <h1 className={styles.supportSubtitle}>Need help with something {name}?</h1>

                <div className={styles.supportForm}>
                    <div className={styles.fieldGroup}>
                        <select
                            className={styles.dropdown}
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="Encouragement">Encouragement</option>
                            <option value="Advice">Advice</option>
                            <option value="Chat">Chat</option>
                            <option value="Celebrate">Celebrate</option>
                        </select>
                    </div>

                    <div className={styles.fieldGroup}>
                        <textarea
                            className={styles.textarea}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Tell your friends what's on your mind..."
                        />
                    </div>
                </div>

                <button
                    className={styles.sendButton}
                    onClick={() => sendSupportRequest()}
                    disabled={!content.trim()}
                >
                    Send to friends
                </button>
            </div>
        </div>
    );
}

export default Support;