// AddFriendsPage.tsx
import styles from './AddFriendsPage.module.css';
import AddFriends from "../components/AddFriends.tsx";

const AddFriendsPage = () => {

    return (
        <div className={styles.addfriendsWrapper}>
            <div className={styles.addfriendsContainer}>
                <h1 className={styles.addfriendsTitle}>Friend Connector</h1>
                <p className={styles.addfriendsSubtitle}>Discover Friends</p>
                <AddFriends />
            </div>
        </div>
    );
};

export default AddFriendsPage;
