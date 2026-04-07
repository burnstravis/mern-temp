import React, { useState } from 'react';
import { buildPath } from './path';
import { retrieveToken, storeToken } from '../tokenStorage';

function CardUI() {
    const _ud = localStorage.getItem('user_data');

    if (!_ud) {
        window.location.href = "/";
    }

    const [message, setMessage] = useState('');
    const [searchResults, setResults] = useState('');
    const [cardList, setCardList] = useState('');
    const [search, setSearchValue] = React.useState('');
    const [card, setCardNameValue] = React.useState('');

    const ud = _ud ? JSON.parse(_ud) : { id: -1 };
    const userId = ud._id;

    async function addCard(e: any): Promise<void> {
        e.preventDefault();

        const token = retrieveToken();
        const obj = { userId: userId, card: card, jwtToken: token };
        const js = JSON.stringify(obj);

        try {
            const response = await fetch(buildPath('api/addcard'), {
                method: 'POST',
                body: js,
                headers: { 'Content-Type': 'application/json' }
            });

            const res = await response.json();

            if (res.error && res.error.length > 0) {
                setMessage("API Error: " + res.error);
            } else {
                setMessage('Card has been added');
                if (res.accessToken) storeToken(res.accessToken);
            }
        } catch (error: any) {
            setMessage(error.toString());
        }
    }

    async function searchCard(e: any): Promise<void> {
        e.preventDefault();

        const token = retrieveToken();
        const obj = { userId: userId, search: search, jwtToken: token };
        const js = JSON.stringify(obj);

        try {
            const response = await fetch(buildPath('api/searchcards'), {
                method: 'POST',
                body: js,
                headers: { 'Content-Type': 'application/json' }
            });

            const res = await response.json();

            if (res.error && res.error.length > 0) {
                setResults("API Error: " + res.error);
                return;
            }

            if (res.accessToken) storeToken(res.accessToken);

            const _results = res.results || [];
            setCardList(_results.join(', '));
            setResults('Card(s) have been retrieved');

        } catch (error: any) {
            setResults("Search failed: " + error.toString());
        }
    }

    function handleSearchTextChange(e: any): void { setSearchValue(e.target.value); }
    function handleCardTextChange(e: any): void { setCardNameValue(e.target.value); }

    return (
        <div id="cardUIDiv">
            <br />
            Search: <input type="text" id="searchText" placeholder="Card To Search For" onChange={handleSearchTextChange} />
            <button type="button" id="searchCardButton" className="buttons" onClick={searchCard}> Search Card</button><br />
            <span id="cardSearchResult">{searchResults}</span>
            <p id="cardList">{cardList}</p><br /><br />
            Add: <input type="text" id="cardText" placeholder="Card To Add" onChange={handleCardTextChange} />
            <button type="button" id="addCardButton" className="buttons" onClick={addCard}> Add Card </button><br />
            <span id="cardAddResult">{message}</span>
        </div>
    );
}

export default CardUI;