const axios = require('axios');

const {client_id, secret, realms} = require('./auth.json');

let bearerToken;
let logTimestamp = new Date();

const getToken = () => {
    try {
        return axios.post('https://oauth.battle.net/token', {
                grant_type: 'client_credentials'
            },
            {
                auth: {
                    password: secret,
                    username: client_id
                },
                headers: {
                    'content-type': 'multipart/form-data'
                }
            })
    } catch (error) {
        console.error(logTimestamp.toLocaleString(), error.message);
    }
};

//set bearer token to var
const setToken = async () => {
    await getToken()
        .then(response => {
            bearerToken = response.data.access_token;
        })
        .catch(error => {
            console.error(logTimestamp.toLocaleString(), error.message)
        });
};

async function getRealmStatus() {
    Object.entries(realms).forEach(([key, val]) => {
        if (!val.prevStatus) {
            realms[key].prevStatus = "init";
        }
        axios({
            url: val.url,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${bearerToken}`
            }
        }).then(response => {
            let status = response.data.status.type;
            const realm = response.data.realms[0].name.en_US + "-" + response.data.realms[0].locale
            if (val.prevStatus !== undefined && val.prevStatus !== status) {
                postToDiscord(val.prevStatus, status, val.webhook, realm);
            }
            realms[key].prevStatus = status;
        }).catch(error => {
            console.error(logTimestamp.toLocaleString(), error.message);
        })
    });
}

async function postToDiscord(prevStatus, status, webhook, name) {
    axios.post(webhook, {
        "content": null,
        "embeds": [
            {
                "title": name + " is now " + status,
                "description": "Realm Status was previously " + prevStatus,
                "color": null
            }
        ],
        "username": "Realm Status Change",
    }).catch(error => console.error(logTimestamp.toLocaleString(), error.message))
}

setInterval(function () {
    setToken().then(function () {
        getRealmStatus();
    });
}, 1000 * 15)
