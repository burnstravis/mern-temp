export function storeToken(tok: any): void {
    try {
        if (tok && tok.accessToken) {
            localStorage.setItem('token_data', tok.accessToken);
        }
        else if (typeof tok === 'string') {
            localStorage.setItem('token_data', tok);
        }
    } catch (e) {
        console.log("Error storing token:", e);
    }
}
export function retrieveToken() : any
{
    var ud;
    try
    {
        ud = localStorage.getItem('token_data');
    }
    catch(e)
    {
        console.log(e);
    }
    return ud;
}