import styles from "./ConversationsPage.module.css";
import Settings from "../components/Settings.tsx";

const SettingsPage = () => {

    return (
        <div className={styles.conversationWrapper}>
            <h1 className={styles.conversationTitle}>Friend Connector</h1>
            <p className={styles.conversationSubtitle}>Messages</p>
            <Settings/>
        </div>
    );

}

export default SettingsPage;
