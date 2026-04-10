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
    // const ud = _ud ? JSON.parse(_ud) : { id: -1 };
    // const userId = ud._id || ud.id;

    // const formatTimeAgo = (dateString: string) => {
    //     const now = new Date();
    //     const past = new Date(dateString);
    //     const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    //
    //     if (diffInSeconds < 60) return 'now';
    //     if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    //     if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    //     if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    //     return `${Math.floor(diffInSeconds / 604800)}w`;
    // };


    return (
        <div className={styles.homeView}>
        </div>
    );
};
export default Home;