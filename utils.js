const crypto        = require('crypto');
const { nextTick } = require('process');
const { store }     = require('./store');

require('dotenv').config();

let salt = process.env.SALT;

function get_token(user) {
    // previous token expires on new login!!
    let txt = `${user.mail_id}${salt}${user.pass_code}${Math.floor(Date.now()/1000)}`;
    return crypto.createHash('sha256').update(txt).digest('base64');
}

function verify_token(req, res, next) {
    const bearer_header = req.headers['authorization'];
    if(typeof bearer_header !== 'undefined') {
        let token =  bearer_header.split(' ')[1];
        store.is_token_valid(token).then(dat => {
            if(dat.is_valid) next(); // token is valid!
            else {
                console.log('token is not valid!');
                res.status(403).send('Forbidden!');
            }
        })
        .catch(er => {
            console.log('Error validating token:', er);
            res.status(403).send('Forbidden!');
        })

    }else {
        console.log('No bearer token provided');
        res.status(403).send('Forbidden!');
    }
}

const utils = {
    get_token,
    verify_token
}

module.exports = {
    utils
}