//import React, { useState } from 'react';
//import { buildPath } from './path';
//import {retrieveToken, storeToken} from '../tokenStorage';
import styles from '../pages/HomePage.module.css'
import {useNavigate} from "react-router-dom";



function Home() {

    const navigate = useNavigate();
    const _ud = localStorage.getItem('user_data');

    if (!_ud) {
        navigate('/');
    }

    return (
        <div className={styles.homeView}>
        </div>
    );
};
export default Home;