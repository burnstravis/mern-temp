import {useEffect, useState} from 'react';
//import { buildPath } from './path';
import { retrieveToken } from '../tokenStorage';
import styles from '../pages/AddFriendsPage.module.css'
import {useNavigate} from "react-router-dom";
import {buildPath} from "./path.ts";



function AddFriends() {

    const navigate = useNavigate();

    const [searchText, setSearchText] = useState('');
    const [users, setUsers] = useState([
        { _id: '1', username: 'jdoe88', firstName: 'John', lastName: 'Doe', birthday: '1988-05-12' },
        { _id: '2', username: 'tech_wizard', firstName: 'Alice', lastName: 'Smith', birthday: '1995-11-23' },
        { _id: '3', username: 'nature_lover', firstName: 'Bob', lastName: 'Green', birthday: '1992-02-14' },
    ]);
    const [message,setMessage] = useState('');


    const _ud = localStorage.getItem('user_data');

    useEffect(() => {
        if (!_ud) {
            navigate('/');
        }
        else{
            //fetchUser(searchText);
            //setUsers()
        }

    }, [navigate, _ud]);

    // const ud = _ud ? JSON.parse(_ud) : { id: -1 };
    // const userId = ud._id || ud.id;


    async function sendFriendRequest(targetUsername: string) {

        try {
            const token = retrieveToken();
            const response = await fetch(buildPath('api/add-friend'), {
                method: 'POST',
                body: JSON.stringify({ username: targetUsername, jwtToken: token, limit: 10}),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const res = await response.json();

            if (res.error && res.error.length > 0) {
                setMessage(res.error);
                return;
            }
        } catch (e) {
            setMessage('Unable to send a friend request: ' + e);
        }
    }

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchText.toLowerCase())
    );


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
                </div>

                <div className={styles.listUsersContainer}>
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
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
                                    onClick={() => sendFriendRequest(user._id)}
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