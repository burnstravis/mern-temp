import {useEffect, useState} from 'react';
//import { buildPath } from './path';
import {retrieveToken, storeToken} from '../tokenStorage';
import styles from '../pages/AddFriendsPage.module.css'
import {useNavigate} from "react-router-dom";
import {buildPath} from "./path.ts";


function AddFriends() {

    const navigate = useNavigate();

    const [searchText, setSearchText] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [message,setMessage] = useState('');


    const _ud = localStorage.getItem('user_data');
    //const ud = _ud ? JSON.parse(_ud) : null;
    //const userId = ud._id || ud.id;

    useEffect(() => {
        if (!_ud) {
            navigate('/');
        }
        else{
            fetchUsers(searchText)
        }

    }, [navigate, _ud]);



    async function fetchUsers(searchText: string) {
        try{
            searchUsers(searchText);
        }
        catch(e){
            setMessage('Unable to fetch users: ' + e);
        }
    }

    async function sendFriendRequest(targetUsername: string, targetUserId: string) {
        setMessage('');
        try {
            const token = retrieveToken();
            if (!token) { navigate('/'); return; }

            const response = await fetch(buildPath('api/friends'), {
                method: 'POST',
                body: JSON.stringify({ username: targetUsername }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const res = await response.json();

            if (res.error) {
                setMessage(res.error);
                return;
            }

            if (res.friendshipId) {
                sendFriendRequestNotification(targetUserId, res.friendshipId);
            }

            setMessage(`Friend request sent to @${targetUsername}!`);


        } catch (e) {
            setMessage('Unable to send a friend request: ' + e);
        }
    }

    async function sendFriendRequestNotification(targetUserId: string, friendshipId: string) {
        try {
            const token = retrieveToken();
            if (!token) return;

            const _ud = localStorage.getItem('user_data');
            const ud = _ud ? JSON.parse(_ud) : {};
            // Use a fallback for names if they aren't in local storage
            const myName = (ud.firstName && ud.lastName)
                ? `${ud.firstName} ${ud.lastName}`
                : "Someone";

            const response = await fetch(buildPath('api/notifications'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    recipientId: targetUserId, // Now correctly utilized by the backend
                    type: 'friend_request',
                    content: `${myName} sent you a friend request!`,
                    relatedId: friendshipId
                })
            });

            const res = await response.json();

            if (res.accessToken) {
                storeToken(res.accessToken);
            }

        } catch (e) {
            console.error("Error sending notification:", e);
        }
    }

    async function searchUsers(searchText: string) {
        setMessage('');
        try {
            const token = retrieveToken();
            if (!token) {
                navigate('/');
                return;
            }

            const response = await fetch(buildPath(`api/users?search=${encodeURIComponent(searchText)}`), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const res = await response.json();

            if (res.error) {
                setMessage(res.error);
                if (res.error.toLowerCase().includes("expired") || res.error.toLowerCase().includes("jwt")) {
                    navigate('/');
                }
                setUsers([]);
                return;
            }

            setUsers(res.users);
            return;

        } catch (e) {
            setMessage('Failed to find users');
            setUsers([]);
            return;
        }
    }

    const handleSearch = () => {
        setMessage('');
        searchUsers
        fetchUsers(searchText)
    };



    return (
        <div className={styles.addFriendsComponent}>

            <h1 className={styles.friendsHeader}>Add New Friends</h1>

            <div className={styles.addFriendsContainer}>
                <div className={styles.addFriendsSearchContainer}>
                    <input
                        type="text"
                        id={styles.addFriendSearch}
                        placeholder="Search username"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        autoFocus={true}
                        autoComplete="off"
                    />

                    <button id={styles.searchButton} type="button" onClick={handleSearch}>Find</button>
                </div>

                <div className={styles.listUsersContainer}>
                    {users.length > 0 ? (
                        users.map((user) => (
                            <div key={user._id} className={styles.userCard}>

                                <div className={styles.userCardInner}>
                                    <div className={styles.userAvatar}>
                                        @{user.username}
                                    </div>

                                    <div className={styles.bottomRow}>
                                        <div className={styles.userDetails}>
                                        <span className={styles.lastText}>
                                            {user.firstName} {user.lastName}
                                        </span>
                                            <span className={styles.timestamp}>
                                            {user.birthday}
                                        </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    id={styles.sendRequest}
                                    type="button"
                                    onClick={() => sendFriendRequest(user.username, user._id)}
                                >
                                    Send
                                </button>

                            </div>
                        ))
                    ) : (
                        <p className={styles.noResults}>No users found.</p>
                    )}
                </div>
            </div>

            <p className={styles.message}>{message}</p>
        </div>
    );
}
export default AddFriends;