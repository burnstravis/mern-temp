// LandingPage.tsx
import './MessagesPage.css';
import Messages from "../components/Messages.tsx";

const MessagesPage = () => {

    return (
        <div id="messagesWrapper">
            <h1 id="messagesTitle">Friend Connector</h1>
            <p id="messagesSubtitle">Messages</p>
            <Messages />
        </div>
    );
};

export default MessagesPage;
