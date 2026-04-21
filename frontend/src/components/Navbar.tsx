import { useNavigate } from 'react-router-dom';
import styles from '../pages/Navbar.module.css'



const Navbar = () => {
    const navigate = useNavigate();

    function doLogout(event:any) : void
    {
        event.preventDefault();
        localStorage.removeItem("user_data");
        localStorage.removeItem("token_data");
        navigate('/');
    };


    return (
        <div className={styles.NavBar}>
            <div className={styles.Navigator}>
                <button className={styles.homeButton} onClick={() => navigate('/home')}>Home</button>
                <button className={styles.messagesButton} onClick={() => navigate('/messages')}>Messages</button>
                <button className={styles.friendsButton} onClick={() => navigate('/friends')}>Friends</button>
                <button className={styles.addfriendsButton} onClick={() => navigate('/addfriends')}>Discover Friends</button>
                <button className={styles.notificationsButton} onClick={() => navigate('/notifications')}>Notifications</button>
                <button className={styles.supportButton} onClick={() => navigate('/support')}>Support</button>
            </div>

            <div className={styles.NavigatorLogOut}>
                <button className={styles.settingsButton} onClick={() => navigate('/settings')}>Settings</button>

                <button className={styles.logoutButton} onClick={doLogout}>Logout</button>
            </div>
        </div>
    );
};

export default Navbar;