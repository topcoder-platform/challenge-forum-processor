const request = require('superagent')
const body = {
    grant_type: 'client_credentials',
    client_id: '9eGR1ZKeWWgaqOxezpDG9X7p81ag88Pn',
    client_secret: '3xrp5GLEkUcqNbstHr10AI8gJDvB_XCUDdBNSJxyfO-cN7qCrorpMLtiiR5Ewd74',
    audience: 'https://m2m.topcoder-dev.com/',
    auth0_url: 'https://topcoder-dev.auth0.com/oauth/token'
}
request.post('https://auth0proxy.topcoder-dev.com/token').set('Content-Type', 'application/json').disableTLSCerts().send(body).then((r) => console.log(r.text)).catch((e) => console.log(e))