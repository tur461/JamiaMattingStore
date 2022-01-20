const sqlite3       = require('sqlite3');
const path          = require('path');
const { normalize } = require('./utils');

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
        db.run(`CREATE TABLE IF NOT EXISTS Bill_Item(
                item_id       INTEGER NOT NULL UNIQUE,
                description   TEXT NOT NULL,
                quantity      INTEGER NOT NULL DEFAULT 0,
                rate          REAL NOT NULL DEFAULT 0.0,
                amount        REAL NOT NULL DEFAULT 0.0,
                deleted       INTEGER NOT NULL DEFAULT 0,
                bill_id       INTEGER NOT NULL,
                PRIMARY KEY(item_id AUTOINCREMENT),
                FOREIGN KEY(bill_id) REFERENCES Bill(bill_id) ON UPDATE CASCADE ON DELETE CASCADE
            )`
        );
        db.run(`CREATE TABLE IF NOT EXISTS Bill(
                bill_id       INTEGER NOT NULL UNIQUE,
                name          text NOT NULL,
                bill_number   text NOT NULL UNIQUE,
                advance       REAL NOT NULL DEFAULT 0.0,
                balance       REAL NOT NULL DEFAULT 0.0,
                total         REAL NOT NULL DEFAULT 0.0,
                dated         INTEGER NOT NULL,
                deleted       INTEGER NOT NULL DEFAULT 0,
                updated_on    INTEGER NOT NULL,
                added_by      text NOT NULL,
                phone         text,
                address       text,
                PRIMARY KEY(bill_id AUTOINCREMENT)
            )`
        );
    }
});

let bill_cols = ['name', 'bill_number', 'advance', 'balance', 'total', 'dated', 'updated_on', 'phone', 'address', 'added_by'];	
let item_cols = ['description', 'quantity', 'rate', 'amount', 'bill_id'];

function _insert_bill_items(items, b_id, resolve, reject) {
    ic = item_cols;
    
    let q = `INSERT INTO Bill_Item(${ic.join(',')}) VALUES ${items.map(item => `(${ic.map(c => `'${item[c]}'`).join(',')})`).join(',')}`
        
    console.log('multiple insert query:', q);
    
    db.run(q, [], function(err) {
        if (err) {
            console.log('error inserting item into bill_item table:', err);
            reject({error: !0, message: err.message});
            return;
        }
        
        // finally!
        resolve({b_id});
    });
}

function _add_bill(bill, resolve, reject) {
	let d = [], q = '';
	bill.updated_on = Math.floor(Date.now()/1000);
	
    d = bill_cols.map(c => bill[c]);
    q = `INSERT INTO bill(${bill_cols.join(',')}) VALUES(${bill_cols.map(bc => `'${bill[bc]}'`).join(',')})`;
    
    console.log('insert query:', q);

	db.run(q, [], function(err) {
		if (err) {
			console.log('error inserting into table bill:', err);
			return reject({ // reject if bill not added!
					err: !0,
					msg: err.message
			});
		}
		
        let bill_id = this.lastID;
		console.log(`A row inserted in bill table with rowid ${bill_id}`);
        
        d = bill.items.map(item => {
            return {
                ...item, bill_id
            }
        });
        
        _insert_bill_items(d, bill_id, resolve, reject);        
	})
      
}

function _update_bill(bill, resolve, reject) {
	bill.updated_on = Math.floor(Date.now()/1000);
	
    let q = `UPDATE Bill SET ${bill_cols.map(b => `${b}='${bill[b]}'`).join(',')} WHERE bill_id=${bill.bill_id}`;
    let bill_id = bill.bill_id;
    console.log('update data:', bill);
    
	db.run(q, [], function(err) {
		if (err) {
			console.log('error updating bill:', err);
			return reject({ // reject if bill not added!
					err: !0,
					msg: err.message
			});
		}
        
		console.log(`A row updated in bill table with rowid ${bill_id}`);

        function update_item(i) {
            let d = bill.items[i];
            d['bill_id'] = bill.bill_id;
            q = `UPDATE Bill_Item SET ${item_cols.map(c => `${c}='${d[c]}'`)} WHERE item_id=${d.item_id}`
            db.run(q, [], function(err) {
                if (err) {
                    console.log('error inserting item into bill_item table:', err);
                    return;
                }
                if(i !== bill.items.length-1) update_item(i+1);
            });
        }
        
        bill.items.length > 0 && update_item(0)
        
        // now lets delete items if any
        if(bill.removed_item_ids.length) {
            q = `DELETE FROM Bill_Item WHERE item_id in (${bill.removed_item_ids.join(',')})`
            db.run(q, [], function(err) {
                if (err) console.log('error deleting items from bill_item table:', err);
            });
        }

        if(bill.new_inserts.length) {
            bill.new_inserts = bill.new_inserts.map(item => {
                return {
                    ...item, bill_id
                }
            })
            _insert_bill_items(bill.new_inserts, bill_id, resolve, reject);
        } else resolve({bill_id});
	})
}

function _get_bill_by_id(id, resolve, reject) {
    let q = `SELECT ${bill_cols.map(b => `b.${b}`).join(',')},${item_cols.map(i => `bi.${i}`).join(',')},bi.item_id FROM bill b JOIN bill_item bi ON b.bill_id = bi.bill_id WHERE b.bill_id=${id} AND NOT b.deleted`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an bill:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched an bill with id ${id}.`);
        resolve({
            err: !1,
            bill: normalize(rows, [...bill_cols], [...item_cols]),
        });
      });
}

function _get_bills(resolve, reject) {
    let q = `SELECT * FROM bill where NOT deleted ORDER BY bill_number LIMIT 100`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an bill:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched bills. count:` + rows.length);
        resolve({
            err: !1,
            rows,
        });
      });
}

function _get_bills_by_name(name, resolve, reject) {
    let q = `SELECT * FROM bill WHERE name like '%${name}%' AND NOT deleted ORDER BY bill_number`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an bill:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched bills. count:` + rows.length);
        resolve({
            err: !1,
            rows,
        });
      });
}

function _get_bills_by_bill_number(bill_number, resolve, reject) {
    let q = `SELECT * FROM bill WHERE bill_number like '%${bill_number}%' AND NOT deleted ORDER BY bill_number`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an bill:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched bills. count:` + rows.length);
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
    let q = `SELECT * FROM User WHERE token='${token}' AND not disabled`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an user:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched user. count:`, rows.length);
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
    add_bill: d => new Promise((r, j) => _add_bill(d, r, j)),
    update_bill: d => new Promise((r, j) => _update_bill(d, r, j)),
    get_bill_by_id: b_id => new Promise((r, j) => _get_bill_by_id(b_id, r, j)),
    get_bills: _ => new Promise((r, j) => _get_bills(r, j)),
    get_bills_by_name: n => new Promise((r, j) => _get_bills_by_name(n, r, j)),
    get_bills_by_bill_number: bn => new Promise((r, j) => _get_bills_by_bill_number(bn, r, j)),
    is_user_valid: u => new Promise((r, j) => _is_user_valid(u, r, j)),
    is_token_valid: t => new Promise((r, j) => _is_token_valid(t, r, j)),
    update_user: (d, m) => new Promise((r, j) => _update_user(d, m, r, j)),
};
module.exports = {
    store
}



