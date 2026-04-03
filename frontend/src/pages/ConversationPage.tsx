// LandingPage.tsx
import './ConversationPage.css';
import Conversation from "../components/Conversation.tsx";

const ConversationPage = () => {

    return (
        <div id="conversationWrapper">
            <div id="conversationContainer">
                <h1 id="conversationTitle">Friend Connector</h1>
                <p id="conversationSubtitle">Messages</p>
                <Conversation />
            </div>
        </div>
    );
};

export default ConversationPage;
