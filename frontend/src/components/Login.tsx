import React, { useState } from 'react';
import { buildPath } from './path';
import { storeToken } from '../tokenStorage';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
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
            const token = res.accessToken;

            if (!token || typeof token !== 'string') {
                setMessage("Error: No valid token received from server.");
                return;
            }

            storeToken(res);
            const decoded: any = jwtDecode(token);
            try {
                var ud = decoded;
                var userId = ud.id;
                var firstName = ud.firstName;
                var lastName = ud.lastName;

                if (!userId) {
                    setMessage('User/Password combination incorrect');
                } else {
                    var user = { firstName: firstName, lastName: lastName, id: userId };
                    localStorage.setItem('user_data', JSON.stringify(user));
                    setMessage('');
                    navigate('/home');
                }
            } catch (e) {
                console.log(e);
            }
        }
        catch(error:any)
        {
            alert(error.toString());
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
    return(
        <div id="loginDiv">
            <span id="inner-title">PLEASE LOG IN</span><br />
            Login: <input type="text" id="loginName" placeholder="Username"
                          onChange={handleSetLoginName} /><br />
            Password: <input type="password" id="loginPassword" placeholder="Password"
                             onChange={handleSetPassword} />
            <input type="submit" id="loginButton" className="buttons" value = "Do It"
                   onClick={doLogin} />
            <span id="loginResult">{message}</span><br />
            <span>Don't have an account? <a href="/register">Register</a></span>
        </div>
    );
};
export default Login;