const sqlite3 = require('sqlite3');
const path = require('path');

const db_path = path.resolve(path.join(__dirname, 'db'), 'jms_1.db');
let db = new sqlite3.Database(db_path, sqlite3.OPEN_READWRITE, err => {
    if (err) {
        console.error(err.message);
    }
    else {
        console.log('Connected to the jms database.');
        db.run(`CREATE TABLE IF NOT EXISTS 
            User(
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                mail_id text UNIQUE NOT NULL, 
                pass_code text NOT NULL,
                token text
            )`
        );
        db.run(`CREATE TABLE IF NOT EXISTS 
            Item(
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                item_name text,
                bill_number text UNIQUE NOT NULL,
                advance REAL DEFAULT 0.0,
                balance REAL DEFAULT 0.0,
                total REAL DEFAULT 0.0,
                dated INTEGER,
                deleted INTEGER DEFAULT 0,
                updated_on INTEGER
            )`
        );
    }
});

function _add_item(item, resolve, reject) {
    let cols = ['item_name', 'bill_number', 'advance', 'balance', 'total', 'dated', 'deleted', 'updated_on']
    let q = `INSERT INTO Item(${cols.join(',')}) VALUES(?)`;
    item.updated_on = Math.floor(Date.now()/1000);
    db.run(q, cols.map(c => item[c]) , function(err) {
      if (err) {
        console.log('error inserting into db:', err);
        return reject({
            err: !0,
            msg: err.message
        });
      }
      console.log(`A row has been inserted with rowid ${this.lastID}`);
      resolve();
    });
}

function _update_item(item, id, resolve, reject) {
    item.updated_on = Math.floor(Date.now()/1000);
    let cols = Object.keys(item);
    let q = `UPDATE Item SET ${cols.map(c => `${c}=?`).join(',')} WHERE id=${id}`;
    db.run(q, cols.map(c => item[c]) , function(err) {
      if (err) {
        console.log('error updating item:', err);
        return reject({
            err: !0,
            msg: err.message
        });
      }
      console.log(`Row(s) updated: ${this.changes}`);
      resolve();
    });
}

function _get_item(id, resolve, reject) {
    let q = `SELECT * FROM Item WHERE id=${id}`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an item:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched an Item with id ${id}.`);
        resolve({
            err: !1,
            rows,
        });
      });
}

function _get_items(resolve, reject) {
    let q = `SELECT * FROM Item ORDER BY bill_number LIMIT 100`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an item:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched items. count:` + rows.length);
        resolve({
            err: !1,
            rows,
        });
      });
}

function _get_items_by_name(name, resolve, reject) {
    let q = `SELECT * FROM Item WHERE item_name like '%${name}%' ORDER BY bill_number`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an item:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched items. count:` + rows.length);
        resolve({
            err: !1,
            rows,
        });
      });
}

function _get_items_by_bill_number(bill_number, resolve, reject) {
    let q = `SELECT * FROM Item WHERE bill_number like '%${bill_number}%' ORDER BY bill_number`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an item:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched items. count:` + rows.length);
        resolve({
            err: !1,
            rows,
        });
      });
}

function _is_user_valid(user, resolve, reject) {
    let q = `SELECT * FROM User WHERE mail_id='${user.mail_id}' and pass_code='${user.pass_code}'`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an user:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched user. count:` + rows.length);
        resolve({
            err: !1,
            is_valid: rows.length ? true : false,
        });
      });
    //   db.close();
}

function _is_token_valid(token, resolve, reject) {
    let q = `SELECT * FROM User WHERE token='${token}'`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an user:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched user. count:` + rows.length);
        resolve({
            err: !1,
            is_valid: rows.length ? true : false,
        });
      });
    //   db.close();
}

function _update_user(data, mail, resolve, reject) {
    data.updated_on = Math.floor(Date.now()/1000);
    let cols = Object.keys(data);
    let q = `UPDATE User SET ${cols.map(c => `${c}=?`).join(',')} WHERE mail_id='${mail}'`;
    db.run(q, cols.map(c => data[c]) , function(err) {
      if (err) {
        console.log('error updating user:', err);
        return reject({
            err: !0,
            msg: err.message
        });
      }
      console.log(`Row(s) updated: ${this.changes}`);
      resolve();
    });
}

const store = {
    add_item: t => new Promise((r, j) => _add_item(t, r, j)),
    update_item: (t, id) => new Promise((r, j) => _update_item(t, id, r, j)),
    get_item: id => new Promise((r, j) => _get_item(id, r, j)),
    get_items: _ => new Promise((r, j) => _get_items(r, j)),
    get_items_by_name: n => new Promise((r, j) => _get_items_by_name(n, r, j)),
    get_items_by_bill_number: bn => new Promise((r, j) => _get_items_by_bill_number(bn, r, j)),
    is_user_valid: u => new Promise((r, j) => _is_user_valid(u, r, j)),
    is_token_valid: t => new Promise((r, j) => _is_token_valid(t, r, j)),
    update_user: (d, m) => new Promise((r, j) => _update_user(d, m, r, j)),
};
module.exports = {
    store
}



