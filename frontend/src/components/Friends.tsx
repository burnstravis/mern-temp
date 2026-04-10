import { useState } from 'react';
//import { buildPath } from './path';
//import { retrieveToken } from '../tokenStorage';
import styles from '../pages/FriendsPage.module.css'
import {useNavigate} from "react-router-dom";

const fakeFriendsList = [
    {
        _id: "friendship_101",
        status: "accepted",
        requesterId: "69d48e049063fbc48903272f",
        recipientId: "user_02_jdoe",
        friendDetails: {
            _id: "user_02_jdoe",
            username: "j_doe88",
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
            birthday: "1992-05-15"
        }
    },
    {
        _id: "friendship_102",
        status: "accepted",
        requesterId: "user_03_asnow",
        recipientId: "69d48e049063fbc48903272f",
        friendDetails: {
            _id: "user_03_asnow",
            username: "aria_stark",
            firstName: "Aria",
            lastName: "Snow",
            email: "aria@winterfell.io",
            birthday: "2001-01-10"
        }
    },
    {
        _id: "friendship_103",
        status: "pending", // Incoming request (Me = Recipient)
        requesterId: "user_04_mscott",
        recipientId: "69d48e049063fbc48903272f",
        friendDetails: {
            _id: "user_04_mscott",
            username: "great_scout",
            firstName: "Michael",
            lastName: "Scott",
            email: "m.scott@dundermifflin.com",
            birthday: "2001-01-10"
        }
    },
    {
        _id: "friendship_104",
        status: "pending",
        requesterId: "69d48e049063fbc48903272f",
        recipientId: "user_05_pbeesly",
        friendDetails: {
            _id: "user_05_pbeesly",
            username: "pam_artist",
            firstName: "Pam",
            lastName: "Beesly",
            email: "pam@dundermifflin.com",
            birthday: "2001-01-10"
        }
    }
];

function Friends() {

    const navigate = useNavigate();
    const [friends, setFriends] = useState(fakeFriendsList);
    //const [loading, setLoading] = useState(true);
    //const [message,setMessage] = useState('');

    const _ud = localStorage.getItem('user_data');

    if (!_ud) {
        navigate('/');
    }
    const ud = _ud ? JSON.parse(_ud) : { id: -1 };
    const userId = ud._id || ud.id;

    // async function fetchFriends() {
    //     console.log("Pretend this fetches friends list from API");
    //     setLoading(true);
    //     try {
    //         const token = retrieveToken();
    //         const response = await fetch(buildPath('api/listFriends'), {
    //             method: 'POST',
    //             body: JSON.stringify({ userId: userId, jwtToken: token }),
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             }
    //         });
    //
    //         const res = await response.json();
    //
    //         if (res.error && res.error.length > 0) {
    //             setMessage("API Error: " + res.error);
    //             return;
    //         } else {
    //             setFriends(res.friends || []);
    //         }
    //     } catch (e) {
    //         setMessage("Failed to load friends" + e);
    //         setFriends([]);
    //     } finally {
    //         setLoading(false);
    //     }
    // }

    // async function loadFriends() {
    //     console.log("Loading friends...");
    //     try{
    //         //API CALL FOR ALL FRIENDS
    //         //SET FRIENDS TO RES.FRIENDS
    //     } catch (e){
    //         setMessage("failed to load friends..." + e);
    //     } finally {
    //         setLoading(false);
    //     }
    // }

    const loadFriendProfile = (friendshipId: string) => {
        const friendUserId = getFriendId(friendshipId);
        if (friendUserId) {
            console.log("Navigating to profile of:", friendUserId);
            // navigate(`/profile/${friendUserId}`);
        }
    };

    const getFriendId = (friendshipId: string) => {
        const friendship = friends.find(f => f._id === friendshipId);
        if (!friendship) return null;
        return friendship.requesterId === userId ? friendship.recipientId : friendship.requesterId;
    };

    const handleAccept = async (friendshipId: string) => {
        console.log("Accepting request:", friendshipId);
        // Add API call here to update status to 'accepted'
        setFriends(prev => prev.map(f =>
            f._id === friendshipId ? { ...f, status: 'accepted' } : f
        ));
    };

    const formatDateOfBirth = (date: string) => {
        return date.replace(/-/g, "/");
    }

    const handleReject = async (friendshipId: string) => {
        console.log("Rejecting/Removing request:", friendshipId);

        // try {
        //     const token = retrieveToken();
        //
        //     const response = await fetch(buildPath('api/removeFriend'), {
        //         method: 'POST',
        //         body: JSON.stringify({
        //             friendshipId: friendshipId,
        //             jwtToken: token
        //         }),
        //         headers: { 'Content-Type': 'application/json' }
        //     });
        //
        //     const res = await response.json();
        //
        //     if (res.error) {
        //         setMessage("Failed to remove: " + res.error);
        //     } else {
        //         setFriends(prev => prev.filter(f => f._id !== friendshipId));
        //     }
        // } catch (e) {
        //     setMessage("Error removing friend: " + e);
        // }


        //FOR HARDCODED DATA
        setFriends(prevFriends => prevFriends.filter(f => f._id !== friendshipId));
    };

    return (
        <div className={styles.friendsList}>
            <h1 className={styles.friendsHeader}>Friends List</h1>
            {friends.map((friendship) => {
                const isRequester = friendship.requesterId === userId;
                const friendData = friendship.friendDetails;

                if (!friendData) return null;

                const displayName = `${friendData.firstName} ${friendData.lastName}`;

                return (
                    <div key={friendship._id} className={styles.friendCard} onClick={() => loadFriendProfile(friendship._id)}>
                        <div className={styles.userHandle}>@{friendData.username}</div>

                        <div className={styles.friendInfo}>
                            <span className={styles.friendName}>{displayName}</span>
                            <div className={styles.friendStatus}>
                                {friendship.status === 'pending' ? (
                                    <span className={styles.pendingTag}>
                                        {isRequester ? "Request Sent" : "Wants to be friends"}
                                    </span>
                                ) : (
                                    <span className={styles.friendTag}>Friend</span>
                                )}
                            </div>
                            <span className={styles.birthday}>DOB: {formatDateOfBirth(friendData.birthday)}</span>
                        </div>

                        <div className={styles.actionArea}>
                            {friendship.status === 'pending' && !isRequester ? (
                                <div className={styles.actionButtons}>
                                    <button
                                        className={styles.acceptBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAccept(friendship._id);
                                        }}
                                    >Accept
                                    </button>

                                    <button
                                        className={styles.rejectBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReject(friendship._id);
                                        }}
                                    >Decline
                                    </button>
                                </div>


                            ) : (
                                <button className={styles.viewBtn}>Open Chat</button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default Friends;