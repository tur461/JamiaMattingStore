const express       = require('express');
const app           = express();
const body_parser   = require('body-parser');
const cors          = require('cors');
const { store }     = require('./store');
const { utils }     = require('./utils');

app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());
app.use(cors({
    origin: 'http://localhost:8000'
}));
let port = process.env.PORT || 8888;

let router = express.Router();

// -=-=-=-=-=-=-=-=-=-=-=-=-= API LIST =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

router.get('/api/items', utils.verify_token, (req, res) => {
    store.get_items().then(data => res.json({
        error: '', items: data.rows
    }))
    .catch(er => {
        console.log('error fetching items from db!:', er);
        res.json({
            error: 'try again', items: []
        });
    })
})

router.get('/api/items_by_name', utils.verify_token, (req, res) => {
    // console.log('searching by name: ', req.query);
    store.get_items_by_name(req.query.name).then(data => res.json({
        error: '', items: data.rows
    }))
    .catch(er => {
        console.log('error fetching items from db!:', er);
        res.json({
            error: 'try again', items: []
        });
    })
})

router.get('/api/items_by_bill_number', utils.verify_token, (req, res) => {
    store.get_items_by_bill_number(req.query.bill_number).then(data => res.json({
        error: '', items: data.rows
    }))
    .catch(er => {
        console.log('error fetching items from db!:', er);
        res.json({
            error: 'try again', items: []
        });
    })
})

router.get('/api/item_by_id', utils.verify_token, (req, res) => {

})

router.post('/api/add_item', utils.verify_token, (req, res) => {

})

router.post('/api/update_item_by_id', utils.verify_token, (req, res) => {

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

app.listen(port);
console.log('listening on port: ' + port);