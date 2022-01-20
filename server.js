const express       = require('express');
const app           = express();
const body_parser   = require('body-parser');
const cors          = require('cors');
const { store }     = require('./store');
const { utils }     = require('./utils');

app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());
app.use(cors({
    origin: [
        'http://127.0.0.1:1255',
        'http://localhost:8000',
    ]
}));
let port = process.env.PORT || 8888;

let router = express.Router();

// -=-=-=-=-=-=-=-=-=-=-=-=-= API LIST =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

router.get('/api/bills', utils.verify_token, (req, res) => {
    store.get_bills().then(data => res.json({
        error: '', bills: data.rows
    }))
    .catch(er => {
        console.log('error fetching bills from db!:', er);
        res.json({
            error: 'try again', bills: []
        });
    })
})

router.get('/api/bills_by_name', utils.verify_token, (req, res) => {
    // console.log('searching by name: ', req.query);
    store.get_bills_by_name(req.query.name).then(data => res.json({
        error: '', bills: data.rows
    }))
    .catch(er => {
        console.log('error fetching bills from db!:', er);
        res.json({
            error: 'try again', bills: []
        });
    })
})

router.get('/api/bills_by_bill_number', utils.verify_token, (req, res) => {
    store.get_bills_by_bill_number(req.query.bill_number).then(data => res.json({
        error: '', bills: data.rows
    }))
    .catch(er => {
        console.log('error fetching bills from db!:', er);
        res.json({
            error: 'try again', bills: []
        });
    })
})

router.get('/api/bill_by_id', utils.verify_token, (req, res) => {
    store.get_bill_by_id(req.query.bill_id).then(data => res.json({
        error: '', bill: data.bill
    }))
    .catch(er => {
        console.log('error fetching bills from db!:', er);
        res.json({
            error: 'try again', bill: null
        });
    })
})

router.post('/api/add_bill', utils.verify_token, (req, res) => {
    console.log('post request insert')
    store.add_bill(req.body).then(d => res.json({
        error: '', message: 'added successfully!', bill_id: d.bill_id,
    }))
    .catch(er => {
        console.log('error adding bill into db!:', er);
        res.json({
            error: 'something went wrong. plz try again!',
        });
    })
})

router.post('/api/update_bill_by_id', utils.verify_token, (req, res) => {
    console.log('post request update')
    store.update_bill(req.body).then(d => res.json({
        error: '', message: 'updated successfully!', bill_id: d.bill_id,
    }))
    .catch(er => {
        console.log('error updating bill!:', er);
        res.json({
            error: 'something went wrong. plz try again!',
        });
    })
})

router.post('/api/auth_user', (req, res) => {
    let user = req.body;
    console.log('auth_user data:', user);
    store.is_user_valid(user).then(dat => {
        console.log('is user valid:', dat.is_valid);
        if(dat.is_valid) {
            let d = {token: utils.get_token(user)};
            store.update_user(d, user.mail_id).then(d => console.log('updated user!'))
            .catch(er => console.log('error updating the user!', er));
            res.json(d);
        }
        else {
            res.status(500).send('access denied!');
        }
    })
    .catch(er => console.log('error:', er));
})

app.use('/', router);

function start_server() {
    app.listen(port);
    console.log('listening on port: ' + port);
}

module.exports = {
    start_server,
}