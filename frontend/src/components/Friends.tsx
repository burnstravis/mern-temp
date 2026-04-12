import {useEffect, useState} from 'react';
import { buildPath } from './path';
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
        status: "pending",
        requesterId: "user_04_mscott",
        recipientId: "69d48e049063fbc48903272f",
        friendDetails: {
            _id: "user_04_mscott",
            username: "great_scout",
            firstName: "Michael",
            lastName: "Scott",
            email: "m.scott@dundermifflin.com",
            birthday: "1965-03-15"
        }
    },
    {
        _id: "friendship_105",
        status: "accepted",
        requesterId: "69d48e049063fbc48903272f",
        recipientId: "user_06_dhalpert",
        friendDetails: {
            _id: "user_06_dhalpert",
            username: "big_tuna",
            firstName: "Jim",
            lastName: "Halpert",
            email: "jim.h@dundermifflin.com",
            birthday: "1978-10-01"
        }
    },
    {
        _id: "friendship_106",
        status: "accepted",
        requesterId: "user_07_dschrute",
        recipientId: "69d48e049063fbc48903272f",
        friendDetails: {
            _id: "user_07_dschrute",
            username: "beet_king",
            firstName: "Dwight",
            lastName: "Schrute",
            email: "dwight@schrute-farms.com",
            birthday: "1970-01-20"
        }
    },
    {
        _id: "friendship_107",
        status: "pending",
        requesterId: "user_08_rswanson",
        recipientId: "69d48e049063fbc48903272f",
        friendDetails: {
            _id: "user_08_rswanson",
            username: "meat_fanatic",
            firstName: "Ron",
            lastName: "Swanson",
            email: "ron@pawnee.gov",
            birthday: "1968-05-06"
        }
    },
    {
        _id: "friendship_108",
        status: "accepted",
        requesterId: "69d48e049063fbc48903272f",
        recipientId: "user_09_lknope",
        friendDetails: {
            _id: "user_09_lknope",
            username: "waffle_lover",
            firstName: "Leslie",
            lastName: "Knope",
            email: "leslie@pawnee.gov",
            birthday: "1975-01-18"
        }
    },
    {
        _id: "friendship_109",
        status: "accepted",
        requesterId: "user_10_aparks",
        recipientId: "69d48e049063fbc48903272f",
        friendDetails: {
            _id: "user_10_aparks",
            username: "april_vibe",
            firstName: "April",
            lastName: "Ludgate",
            email: "april@parks.org",
            birthday: "1989-04-30"
        }
    },
    {
        _id: "friendship_111",
        status: "accepted",
        requesterId: "user_12_tsharp",
        recipientId: "69d48e049063fbc48903272f",
        friendDetails: {
            _id: "user_12_tsharp",
            username: "ted_lasso",
            firstName: "Ted",
            lastName: "Lasso",
            email: "ted@afcrichmond.com",
            birthday: "1975-09-18"
        }
    },
    {
        _id: "friendship_112",
        status: "accepted",
        requesterId: "69d48e049063fbc48903272f",
        recipientId: "user_13_rkent",
        friendDetails: {
            _id: "user_13_rkent",
            username: "roy_grumpy",
            firstName: "Roy",
            lastName: "Kent",
            email: "roy@richmond.co.uk",
            birthday: "1980-02-12"
        }
    },
    {
        _id: "friendship_113",
        status: "accepted",
        requesterId: "user_14_skelly",
        recipientId: "69d48e049063fbc48903272f",
        friendDetails: {
            _id: "user_14_skelly",
            username: "scully_fox",
            firstName: "Dana",
            lastName: "Scully",
            email: "scully@fbi.gov",
            birthday: "1964-02-23"
        }
    },
    {
        _id: "friendship_114",
        status: "pending",
        requesterId: "user_15_fmulder",
        recipientId: "69d48e049063fbc48903272f",
        friendDetails: {
            _id: "user_15_fmulder",
            username: "i_believe",
            firstName: "Fox",
            lastName: "Mulder",
            email: "mulder@fbi.gov",
            birthday: "1961-10-13"
        }
    },
    {
        _id: "friendship_115",
        status: "accepted",
        requesterId: "69d48e049063fbc48903272f",
        recipientId: "user_16_hpotter",
        friendDetails: {
            _id: "user_16_hpotter",
            username: "chosen_one",
            firstName: "Harry",
            lastName: "Potter",
            email: "harry@hogwarts.ac.uk",
            birthday: "1980-07-31"
        }
    },
    {
        _id: "friendship_116",
        status: "pending",
        requesterId: "user_17_hgranger",
        recipientId: "69d48e049063fbc48903272f",
        friendDetails: {
            _id: "user_17_hgranger",
            username: "levio-sa",
            firstName: "Hermione",
            lastName: "Granger",
            email: "hermione@hogwarts.ac.uk",
            birthday: "1979-09-19"
        }
    },
    {
        _id: "friendship_117",
        status: "accepted",
        requesterId: "user_18_rweasley",
        recipientId: "69d48e049063fbc48903272f",
        friendDetails: {
            _id: "user_18_rweasley",
            username: "king_ron",
            firstName: "Ron",
            lastName: "Weasley",
            email: "ronnie@hogwarts.ac.uk",
            birthday: "1980-03-01"
        }
    },
    {
        _id: "friendship_118",
        status: "accepted",
        requesterId: "69d48e049063fbc48903272f",
        recipientId: "user_19_bwayne",
        friendDetails: {
            _id: "user_19_bwayne",
            username: "dark_knight",
            firstName: "Bruce",
            lastName: "Wayne",
            email: "bruce@wayne-ent.com",
            birthday: "1972-02-19"
        }
    },
    {
        _id: "friendship_120",
        status: "accepted",
        requesterId: "user_21_pparker",
        recipientId: "69d48e049063fbc48903272f",
        friendDetails: {
            _id: "user_21_pparker",
            username: "web_head",
            firstName: "Peter",
            lastName: "Parker",
            email: "pete@dailybugle.net",
            birthday: "2001-08-10"
        }
    }
];
function Friends() {

    const navigate = useNavigate();
    const [friends, setFriends] = useState(fakeFriendsList);
    const [searchText, setSearchText] = useState('');
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(false);
    const [message,setMessage] = useState('');

    const _ud = localStorage.getItem('user_data');


    const ud = _ud ? JSON.parse(_ud) : { id: -1 };
    const userId = ud._id || ud.id;

    useEffect(() => {
        if (!ud) {
            navigate('/');
        } else {

            //TEMP
            const limit = 10;

            const searchFiltered = fakeFriendsList.filter(f =>
                f.friendDetails.username.toLowerCase().includes(searchText.toLowerCase())
            );

            const newTotalPages = Math.ceil(searchFiltered.length / limit);
            setTotalPages(newTotalPages || 1);

            if (pageNumber > newTotalPages && newTotalPages > 0) {
                setPageNumber(1);
            }

            const start = (pageNumber - 1) * limit;
            const end = start + limit;
            const paginated = searchFiltered.slice(start, end);

            setFriends(paginated);
            //TEMP


            //fetchFriends(pageNumber);
        }
    }, [pageNumber, searchText]);

    async function fetchFriends(pageNumber: number) {

        setLoading(true);
        try {
            //const token = retrieveToken();
            const response = await fetch(buildPath('api/friends-list'), {
                method: 'POST',
                body: JSON.stringify({ userId: userId, page: pageNumber, limit: 10}),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const res = await response.json();

            if (res.error && res.error.length > 0) {
                setMessage("API Error: " + res.error);
                return;
            } else {
                setFriends(res.friends || []);
                setTotalPages(res.totalPages || 1);
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

    const handleSearch = () => {
        const filtered = fakeFriendsList.filter(f =>
            f.friendDetails.username.toLowerCase().includes(searchText.toLowerCase())
        );
        setFriends(filtered);
    };

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

        //CALL API FOR ACCEPTING FRIEND REQUEST
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
                                            >Reject
                                            </button>
                                        </div>


                                    ) : (
                                        <button className={styles.viewBtn}>Open Chat</button>
                                    )}
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