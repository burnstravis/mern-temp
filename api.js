require('express');
require('mongodb');
const tokenHandler = require('./createJWT.js'); 



exports.setApp = function (app, client) {

    app.post('/api/addcard', async (req, res, next) =>
    {
        const { userId, card, jwtToken } = req.body;

        if (!jwtToken) {
            return res.status(200).json({ error: 'No token provided', jwtToken: '' });
        }

        try {
            if (tokenHandler.isExpired(jwtToken)) {
                return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
            }
        } catch (e) {
            console.log(e.message);
        }

        const newCard = { Card: card, UserId: userId };
        var error = '';

        try {
            const db = client.db('COP4331Cards');
            await db.collection('Cards').insertOne(newCard);
        } catch (e) {
            error = e.toString();
        }

        var refreshedToken = null;
        try {
            const refreshed = tokenHandler.refresh(jwtToken);
            refreshedToken = refreshed.accessToken;
        } catch (e) {
            console.log(e.message);
        }

        res.status(200).json({ error: error, jwtToken: refreshedToken });
    });

    app.post('/api/login', async (req, res, next) => 
    {
        const { login, password } = req.body; 

        const db = client.db('large_project'); 
        let ret;
        try {
            const results = await db.collection('users').find({
                username: login,  
                passwordHash: password 
            }).toArray();

            if (results.length > 0) {
                const user = results[0];
                
                // Generate the token using the keys from your document
                const tokenData = tokenHandler.createToken(user.firstName, user.lastName, user._id);

                ret = {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    accessToken: tokenData.accessToken,
                    error: ''
                };
            } else {
                ret = { error: "Login/Password incorrect", accessToken: '' };
            }
        } catch (e) {
            ret = { error: e.toString() };
        }
        res.status(200).json(ret);
    });

    app.post('/api/register', async (req, res, next) =>
    {
        const { firstName, lastName, email, username, password } = req.body;

        const newUser = {
            FirstName: firstName,
            LastName: lastName,
            Email: email,
            Username: username,
            Password: password
        };

        var error = '';

        try {
            const db = client.db('COP4331Cards');

            const existingUser = await db.collection('Users').findOne({ Login: username });
            if(existingUser){
                return res.status(200).json({ error: 'Username already taken' });
            }

            await db.collection('Users').insertOne(newUser);
        } catch (e) {
            error = e.toString();
            return res.status(200).json({ error: error });
        }

        res.status(200).json({ error: error });
    });



    app.post('/api/searchcards', async (req, res, next) =>
    {
        var error = '';
        const { userId, search, jwtToken } = req.body;

        try {
            if (tokenHandler.isExpired(jwtToken)) { //
                return res.status(200).json({ error: 'The JWT is no longer valid', jwtToken: '' });
            }
        } catch (e) {
            console.log(e.message);
        }

        var _search = search.trim();
        const db = client.db('COP4331Cards');
        const results = await db.collection('Cards').find({"Card":{$regex:_search+'.*',
                $options:'i'}}).toArray();

        var _ret = results.map(item => item.Card);

        var refreshedToken = null;
        try {
            const refreshed = tokenHandler.refresh(jwtToken);
            refreshedToken = refreshed.accessToken;
        } catch (e) {
            console.log(e.message);
        }

        res.status(200).json({ results: _ret, error: error, jwtToken: refreshedToken });
    });
}