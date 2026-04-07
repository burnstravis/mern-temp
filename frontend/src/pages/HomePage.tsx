import styles from './HomePage.module.css';
import Home from "../components/Home.tsx";
import React from "react";


const HomePage = () => {

    return (
        <div className={styles.homeWrapper}>

            <div className={styles.homeContainer}>
                <h1 className={styles.homeTitle}>Friend Connector</h1>
                <p className={styles.homeSubtitle}>Welcome Home</p>
                <Home />
            </div>
        </div>
    );
};

export default HomePage;
