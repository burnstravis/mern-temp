import Notifications from '../components/Notifications';
import styles from './FriendsPage.module.css';



const NotificationPage = () => {
  return (
    <div id="registerWrapper" className="wrapper">
      <div id="registerContainer" className="container">
        <h1 className={styles.friendsTitle}>Friend Connector</h1>
        <Notifications />
      </div>
    </div>
  );
};

export default NotificationPage;
