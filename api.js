require('express');
require('mongodb');
const tokenHandler = require('./createJWT.js'); //

exports.setApp = function (app, client) {

    app.post('/api/addcard', async (req, res, next) =>
    {
        const { userId, card, jwtToken } = req.body;

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

    app.post('/api/login', async (req, res, next) => {
        const { login, password, jwtToken } = req.body;

        if (jwtToken) {
            try {
                if (tokenHandler.isExpired(jwtToken)) {
                    return res.status(200).json({ error: 'The JWT is no longer valid', accessToken: '' });
                }
            } catch (e) {
                console.log("JWT Check Error:", e.message);
            }
        }

        const db = client.db('COP4331Cards');
        let ret;

        try {
            const results = await db.collection('Users').find({ Login: login, Password: password }).toArray();

            if (results.length > 0) {
                const id = results[0].UserId;
                const fn = results[0].FirstName;
                const ln = results[0].LastName;

                const tokenData = tokenHandler.createToken(fn, ln, id);

                ret = {
                    id: id,
                    firstName: fn,
                    lastName: ln,
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