function normalize(rows, bcols, icols) {
    let res = {
        items: []
    }
    
    icols.push('item_id');
    bcols.push('bill_id');

    bcols.forEach(b => res[b] = rows[0][b]);
    rows.forEach(row => {
        let item = {};
        icols.forEach(i => i !== 'bill_id' && (item[i] = row[i]));
        res.items.push(item);
    });
    return res;
}

module.exports = {
    normalize,
}