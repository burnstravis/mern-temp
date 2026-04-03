// LandingPage.tsx
import './ConversationPage.css';
import Conversation from "../components/Conversation.tsx";

const ConversationPage = () => {

    return (
        <div id="messagesWrapper">
            <div id="messagesContainer">
                <h1 id="messagesTitle">Friend Connector</h1>
                <p id="messagesSubtitle">Messages</p>
                <Conversation />
            </div>
        </div>
    );
};

export default ConversationPage;
