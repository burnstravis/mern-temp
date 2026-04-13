import {useEffect, useState} from 'react';
import { buildPath } from './path';
import { retrieveToken, storeToken  } from '../tokenStorage';
import styles from '../pages/FriendsPage.module.css'
import {useNavigate} from "react-router-dom";

interface Friend {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    birthday: string;
}

function Friends() {

    const navigate = useNavigate();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [searchText, setSearchText] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(false);
    const [message,setMessage] = useState('');

    const _ud = localStorage.getItem('user_data');


    const ud = _ud ? JSON.parse(_ud) : null;
    //const userId = ud._id || ud.id;

    useEffect(() => {
        if (!ud) {
            navigate('/');
        } else {
            fetchFriends(pageNumber);
        }
    }, [pageNumber]);

    async function fetchFriends(pageNumber: number) {

        setLoading(true);
        try {
            const token = retrieveToken();

            const queryParams = new URLSearchParams({
                page: pageNumber.toString(),
                limit: "10",
                search: searchText
            });

            const response = await fetch(`${buildPath('api/friends')}?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const res = await response.json();


            if (!response.ok || res.error) {
                const errorMsg = res.error || "An unknown error occurred";
                setMessage("API Error: " + errorMsg);

                if (response.status === 401 || errorMsg.includes("expired") || errorMsg.includes("valid")) {
                    navigate('/');
                }
                return;
            } else {

                setFriends(res.friends || []);
                setTotalPages(res.totalPages || 1);

                if (res.accessToken) {
                    storeToken(res.accessToken);
                }
            }
        } catch (e) {
            setMessage("Failed to load friends" + e);
            setFriends([]);
        } finally {
            setLoading(false);
        }
    }

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPageNumber(newPage);
        }
    };


    const filteredFriends = friends.filter(f => {
        const friend = f;
        if (!friend) return false;

        const term = activeSearch.toLowerCase();

        return (
            friend.username.toLowerCase().includes(term) ||
            friend.firstName.toLowerCase().includes(term) ||
            friend.lastName.toLowerCase().includes(term)
        );
    });

    const handleSearch = () => {
        setActiveSearch(searchText);
        setPageNumber(1);
        fetchFriends(pageNumber);
    };

    const formatDateOfBirth = (date: any) => {
        if (!date) return "N/A";
        const cleanDate = date.includes('T') ? date.split('T')[0] : date;
        return cleanDate.replace(/-/g, "/");
    };

    async function loadFriendProfile(friendId: string) {
        console.log("opens chat with user" + friendId);
    }

    return (
        <div className={styles.friendsList}>

            <h1 className={styles.friendsHeader}>Friends List</h1>

            <div className={styles.friendsSearchWrapper}>
                <input
                    type="text"
                    id={styles.friendsSearch}
                    placeholder="Search username"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    autoFocus={true}
                    autoComplete="off"
                    autoCapitalize="off"
                />

                <button id={styles.searchFriendsButton} type="button" onClick={handleSearch}>Find</button>

            </div>



            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    {filteredFriends.map((friendship) => {
                        const friendData = friendship;

                        if (!friendData) return null;

                        const displayName = `${friendData.firstName} ${friendData.lastName}`;

                        return (
                            <div key={friendship._id} className={styles.friendCard} onClick={() => loadFriendProfile(friendship._id)}>
                                <div className={styles.userHandle}>@{friendData.username}</div>

                                <div className={styles.friendInfo}>
                                    <span className={styles.friendName}>{displayName}</span>
                                    <span className={styles.birthday}>DOB: {formatDateOfBirth(friendData.birthday)}</span>
                                </div>

                                <div className={styles.actionArea}>
                                    <button className={styles.viewBtn}>Open Chat</button>
                                </div>
                            </div>
                        );
                    })}

                    <div className={styles.paginationControls}>
                        <button
                            disabled={pageNumber === 1}
                            onClick={() => handlePageChange(pageNumber - 1)}
                        >
                            Previous
                        </button>

                        <span> Page {pageNumber} of {totalPages} </span>

                        <button
                            disabled={pageNumber === totalPages}
                            onClick={() => handlePageChange(pageNumber + 1)}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
            <p className={styles.errorMessage}>{message}</p>
        </div>
    );
}

export default Friends;