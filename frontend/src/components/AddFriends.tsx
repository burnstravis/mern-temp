import {useEffect, useState} from 'react';
//import { buildPath } from './path';
import {retrieveToken} from '../tokenStorage';
import styles from '../pages/AddFriendsPage.module.css'
import {useNavigate} from "react-router-dom";
import {buildPath} from "./path.ts";

const fakeUsers = [
    {
        _id: '69d4944bdc68a7a71ca1c6e4',
        username: 'tech_wizard',
        firstName: 'Alice',
        lastName: 'Smith',
        birthday: '1995-11-23T00:00:00.000Z'
    },
    {
        _id: '69d4944bdc68a7a71ca1c6e5',
        username: 'nature_lover',
        firstName: 'Bob',
        lastName: 'Green',
        birthday: '1992-02-14T00:00:00.000Z'
    }
];

function AddFriends() {

    const navigate = useNavigate();

    const [searchText, setSearchText] = useState('');
    const [users, setUsers] = useState(fakeUsers);
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

    }, [navigate, _ud, searchText]);



    async function fetchUsers(searchText: string) {
        try{
            setUsers(fakeUsers)
            console.log(searchText);
        }
        catch(e){
            setMessage('Unable to fetch users: ' + e);
        }
    }

    async function sendFriendRequest(targetUsername: string) {

        setMessage('');

        try {
            const token = retrieveToken();

            if (!token) {
                navigate('/');
                return;
            }

            const response = await fetch(buildPath('api/add-friend'), {
                method: 'POST',
                body: JSON.stringify({ username: targetUsername, jwtToken: token}),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const res = await response.json();
            console.log(res);

            if (res.error && res.error.length > 0) {
                setMessage(res.error);

                if (res.error.toLowerCase().includes("expired") || res.error.toLowerCase().includes("jwt")) {
                    navigate('/');
                }
                return;
            }

            setMessage(`Friend request sent to @${targetUsername}!`);

        } catch (e) {
            setMessage('Unable to send a friend request: ' + e);
        }
    }

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleSearch = () => {
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
                                    onClick={() => sendFriendRequest(user.username)}
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