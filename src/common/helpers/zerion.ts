import axios from "axios";

export const getPortfolio = async (ethAddress: string) => {
    const username = process.env.NEXT_PUBLIC_ZERION_API_KEY;
    const password = '';
    const basicAuth = 'Basic ' + btoa(username + ':' + password);

    const options = {
        method: 'GET',
        url: `https://api.zerion.io/v1/wallets/${ethAddress}/portfolio`,
        headers: {
          accept: 'application/json',
          authorization: basicAuth
        }
    };
    
    return axios
        .request(options)
        .then(function (response) {
            return response.data.data;
        })
        .catch(function (error) {
            console.error(error);
            return null;
        });
}

// This helper function adds CORS headers to the response
const allowCors = (fn) => async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*') // Adjust this to match your client-side URL or * for public API
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }
    return await fn(req, res)
}

export default allowCors(getPortfolio);