import { buildPath } from './path';
import { retrieveToken } from '../tokenStorage';
import { useEffect, useState } from 'react';
import styles from '../pages/SettingsPage.module.css';
import { useNavigate } from "react-router-dom";


function Settings() {

    const navigate = useNavigate();
    const _ud = localStorage.getItem('user_data');

    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!_ud) {
            navigate('/');
            return;
        }
    }, [_ud, navigate]);

    const deleteAccount = async () => {
        if (!window.confirm("Are you absolutely sure? This will permanently delete your account and all associated data.")) {
            return;
        }

        try {
            const token = retrieveToken(); // Uses your provided tokenStorage utility
            const response = await fetch(buildPath('api/users/me'), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const res = await response.json();

            if (response.ok) {
                localStorage.removeItem('user_data');

                alert("Account successfully deleted.");
                navigate('/');
            } else {
                setMessage(res.error || "An error occurred during deletion.");
            }
        } catch (error) {
            console.error("Deletion error:", error);
            setMessage("Lost connection to the server.");
        }
    };

    return (
        <div className={styles.settingsContainer}>
            <h1 className={styles.settingsSubtitle}>Account Settings</h1>
            <h2 className={styles.settingsText}>Warning: Deleting your account is permanent.</h2>


            <button
                onClick={deleteAccount} className={styles.settingsButton}
            >
                Delete My Account
            </button>

            {message && <p className={styles.errorMessage}>{message}</p>}
        </div>
    );

}

export default Settings;