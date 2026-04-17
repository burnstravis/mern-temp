import styles from './HomePage.module.css';
import Home from "../components/Home.tsx";


const HomePage = () => {

    const _ud = localStorage.getItem('user_data');
    const ud = _ud ? JSON.parse(_ud) : { id: null };
    const name = ud.firstName.toString().charAt(0).toUpperCase() + ud.firstName.toString().slice(1) || "";

    return (
        <div className={styles.homeWrapper}>

            <div className={styles.homeContainer}>
                <h1 className={styles.homeTitle}>Friend Connector</h1>
                <p className={styles.homeSubtitle}>Welcome Home {name}</p>
                <Home />
            </div>
        </div>
    );
};

export default HomePage;
