import styles from './HomePage.module.css';
import Home from "../components/Home.tsx";
import React from "react";

function goToHome(): void {
    window.location.href = '/home';
}

function goToMessages(): void {
    window.location.href = '/messages';
}
function goToFriends(): void {
    window.location.href = '/friends';
}

function goToNotifications(): void {
    window.location.href = '/notifications';
}

function goToSettings(): void {
    window.location.href = '/settings';
}


const HomePage = () => {

    return (
        <div className={styles.homeWrapper}>

            <div className={styles.homeNavBar}>

                <div className={styles.homeNavigator}>
                    <button className={styles.homeButton} type="button" onClick={goToHome}>Home</button>
                    <button className={styles.messagesButton} type="button" onClick={goToMessages}>Messages</button>
                    <button className={styles.friendsButton} type="button" onClick={goToFriends}>Friends</button>
                    <button className={styles.notificationsButton} type="button" onClick={goToNotifications}>Notifications</button>
                    <button className={styles.settingsButton} type="button" onClick={goToSettings}>Settings</button>
                </div>

            </div>
            <div className={styles.homeContainer}>
                <h1 className={styles.homeTitle}>Friend Connector</h1>
                <p className={styles.homeSubtitle}>Welcome Home</p>
                <Home />
            </div>
        </div>
    );
};

export default HomePage;
