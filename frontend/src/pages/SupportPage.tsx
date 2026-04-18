import styles from './HomePage.module.css';
import Support from "../components/Support.tsx";


const SupportPage = () => {

    return (
        <div className={styles.homeWrapper}>

            <div className={styles.homeContainer}>
                <h1 className={styles.homeTitle}>Friend Connector</h1>
                <p className={styles.homeSubtitle}>Request Support</p>
                <Support />
            </div>
        </div>
    );
};

export default SupportPage;
