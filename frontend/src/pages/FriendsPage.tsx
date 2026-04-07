// LandingPage.tsx
import styles from './FriendsPage.module.css';
import Friends from "../components/Friends.tsx";

const FriendsPage = () => {

    return (
        <div className={styles.friendsWrapper}>
            <div className={styles.friendsContainer}>
                <h1 className={styles.friendsTitle}>Friend Connector</h1>
                <p className={styles.friendsSubtitle}>Friends</p>
                <Friends />
            </div>
        </div>
    );
};

export default FriendsPage;
