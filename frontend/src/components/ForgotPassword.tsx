import styles from '../css/ForgotPasswordPage.module.css';
import React, { useState } from 'react';


function ForgotPassword()
{
    
    function doForgotPassword(){
        setMessage("If an account exists, we sent an email");        
    }
    const [message,setMessage] = useState('');
    return (
        <div className={styles.forgotPasswordContainer}>
            <h1 className={styles.forgotPasswordTitle}>Forgot Password?</h1>
            <h2 className={styles.forgotPasswordSubTitle}>Enter the email address associated with your account and we will send you a link to reset your password.</h2>
            <div className={styles.inputDiv}>
                <label className={styles.inputLabel}>Email</label>
                <div className="input-container">
                    <input
                        type="text"
                        className={styles.emailField}
                        placeholder="Email"
                        //onChange={handleSetLoginName}
                        
                    />
                    <p className={styles.submitMessage}>{message}</p>
                    <button type="submit"
                        className={styles.submitButton}
                        value="Sign in"
                        onClick={doForgotPassword}
                        >Submit</button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;