// LandingPage.tsx
import styles from './MessagesPage.module.css';
import Messages from "../components/Messages.tsx";

const MessagesPage = () => {

    return (
        <div className={styles.messagesWrapper}>
            <div className={styles.messagesContainer}>
                <h1 className={styles.messagesTitle}>Friend Connector</h1>
                <p className={styles.messagesSubtitle}>Messages</p>
                <Messages />
            </div>
        </div>
    );
};

export default MessagesPage;
