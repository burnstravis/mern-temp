import React, { useState } from 'react';
import { buildPath } from './path';
import { storeToken } from '../tokenStorage';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import styles from '../pages/LoginPage.module.css';
// @ts-ignore
function Login()
{
    const navigate = useNavigate();
    const [message,setMessage] = useState('');
    const [username,setLoginName] = React.useState('');
    const [password,setPassword] = React.useState('');
    async function doLogin(event:any) : Promise<void>
    {
        event.preventDefault();
        var obj = {login:username,password:password};
        var js = JSON.stringify(obj);
        try
        {
            const response = await fetch(buildPath('api/login'), {
                method: 'POST',
                body: js,
                headers: { 'Content-Type': 'application/json' }
            });

            const res = await response.json();
            if (!res.accessToken) {
                if (res.error) {
                    setMessage(res.error);
                } else {
                    setMessage("Login failed: No token received.");
                }
                return;
            }

            const token = res.accessToken;
            storeToken(res);

            try {

                const decoded: any = jwtDecode(token);
                var userId = decoded.id;
                var firstName = decoded.firstName;
                var lastName = decoded.lastName;

                if (!userId) {
                    setMessage('User/Password combination incorrect');
                } else {
                    var user = { firstName: firstName, lastName: lastName, id: userId };
                    localStorage.setItem('user_data', JSON.stringify(user));
                    setMessage('');
                    navigate('/home');
                }
            } catch (e) {
                console.error("JWT Decode Error:", e);
                setMessage("Error processing login session.");
            }
        }
        catch(error:any)
        {
            setMessage("Server Connection Error.");
            return;
        }

    };
    function handleSetLoginName( e: any ) : void
    {
        setLoginName( e.target.value );
    }
    function handleSetPassword( e: any ) : void
    {
        setPassword( e.target.value );
    }
    return (
        <div className={styles.loginContainer}>
            <h1 className={styles.loginTitle}>Login</h1>
            <h2 className={styles.loginSubTitle}>Enter your details below</h2>

            <form className={styles.loginForm}>
                <div className={styles.inputDiv}>
                    <label className={styles.inputLabel}>Username</label>
                    <div className="input-container">
                        <input
                            type="text"
                            className={styles.loginField}
                            placeholder="Username"
                            onChange={handleSetLoginName}
                        />
                    </div>
                </div>

                <div className={styles.inputDiv}>
                    <label className={styles.inputLabel}>Password</label>
                    <div className="input-container">
                        <input
                            type="password"
                            className={styles.passwordField}
                            placeholder="Password"
                            onChange={handleSetPassword}
                        />
                    </div>
                </div>

                <button type="submit"
                        className={styles.loginButton}
                        value="Sign in"
                        onClick={doLogin}
                        >Sign In</button>
                <p className={styles.loginMessage}></p>
            </form>

        </div>
    );

}

export default Login;