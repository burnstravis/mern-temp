// LandingPage.tsx
import styles from './ConversationsPage.module.css';
import Conversation from "../components/Conversation.tsx";

const ConversationPage = () => {

    return (
        <div className={styles.conversationWrapper}>
            <div className={styles.conversationContainer}>
                <h1 className={styles.conversationTitle}>Friend Connector</h1>
                <p className={styles.conversationSubtitle}>Messages</p>
                <Conversation />
            </div>
        </div>
    );
};

export default ConversationPage;
