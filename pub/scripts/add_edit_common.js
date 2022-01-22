$(document).ready(function() {

    $('#add_row-item').on('click', add_row);
    
    $('input').on('focus', remove_err);

    $('#qty_1').on('keyup', change_amount);
    $('#rate_1').on('keyup', change_amount);

    $('#debit').on('keyup', change_credit);
    $('#credit').on('keyup', change_debit);

    $('#clear_bill').on('click', e => {
        $('input').each((_, el) => $(el).val(''));
    })    
});

const PAGE = { EDIT: 1, ADD: 2, VIEW: 3, };
let row_ctr = 1;
let removed = [];
let rem_item_ids = [];
let err = { ids: []};
let page = -1;
let original_font_size = 0.0;
let print_font_inc = 0.25;

function reset_vars(pg) {
    row_ctr = 1;
    removed = [];
    rem_item_ids = [];
    err = {ids:[]};
    page = pg;
}

function is_edit_page() { 
    return page === PAGE.EDIT;
}

function is_add_page() { 
    return page === PAGE.ADD;
}

function add_row(e) { 
    e && handle_e(e);
    let node = process_node($('#item-row_1').clone());
    $('#item-rows_container').append(node);
}

function process_node(node) {
    ++row_ctr;
    node.children().each((_, elm) => {
        $(elm).children().each((_, el) => {
            el = $(el);
            if(el.is('label')) el.remove();//el.attr('for', `${el.text()}_${row_ctr}`);
            if(el.is('input')) {
                el.attr({
                    'id': `${el.attr('id').split('_')[0]}_${row_ctr}`,
                    'name': `${el.attr('name').split('_')[0]}_${row_ctr}`,
                })
                el.val('');
                if(el.attr('id').indexOf('qty')!=-1 ||
                    el.attr('id').indexOf('rate')!=-1)
                    el.on('keyup', change_amount);
                if(el.attr('id').indexOf('amount')!=-1)
                    el.attr('disabled', true);
                el.on('focus', remove_err);
                el.removeClass('is-invalid');
            }
            if(el.is('button')) {
                el.attr({
                    'disabled': false,
                    'id': `remove-item_${row_ctr}`
                });
                el.on('click', remove_item);
            }
        })
    });
    node.attr('id', `item-row_${row_ctr}`);
    return node;
}

function remove_item(e) {
    handle_e(e);
    let i = $(e.target).attr('id').split('_')[1];
    removed.push(+i);
    
    if(is_edit_page()) rem_item_ids.push(get_item_id(i));

    $(`#item-row_${i}`).remove();
    console.log('item_ids removed:', rem_item_ids)
    change_gross_total();
}

function get_item_id(i) {
    let id  = $(`#item-row_${i}`).data('item_id');
    return id === undefined ? 0 : id;
}

function change_credit(e) {
    e && handle_e(e);
    let debit = +$('#debit').val() || 0;
    let g_total = +$('#gross_total').val() || 0;
    $('#credit').val(g_total - debit);
}

function change_debit(e) {
    e && handle_e(e);
    let credit = +$('#credit').val() || 0;
    let g_total = +$('#gross_total').val() || 0;
    $('#debit').val(g_total - credit);
}

function change_amount(e) {
    handle_e(e);
    console.log('change amount')
    let num = $(e.target).attr('id').split('_')[1];
    let qty = +$(`#qty_${num}`).val() || 0;
    let rate = +$(`#rate_${num}`).val() || 0;
    $(`#amount_${num}`).val(rate * qty);
    change_gross_total();
}

function change_gross_total() {
    let total_amount = 0;
    for(let i=1, amnt = 0; i<=row_ctr; ++i)
        if(removed.indexOf(i) === -1) {
            amnt = +$(`#amount_${i}`).val() || 0;
            total_amount += amnt;
        }
    $('#gross_total').val(total_amount);
    // change only debit if any variant changes other than credit!
    change_debit();
}

function try_get_bill_data() {
    err.ids = [];
    let sec_1 = {
        bill_number: $('#bill_number').val(),
        name: $('#name').val(),
        phone: $('#phone').val(),
        address: $('#address').val(),
        dated: new Date($('#dated').val()).getTime(),
    };

    if(!validate.bill_num(sec_1.bill_number))
        err.ids.push({
            id: `bill_number`,
            message: 'bill number not valid',
        });

    if(!validate.name(sec_1.name))
        err.ids.push({
            id: `name`,
            message: 'name not valid',
        });

    if(!validate.phone(sec_1.phone))
        err.ids.push({
            id: `phone`,
            message: 'phone not valid',
        });

    if(!validate.address(sec_1.address))
        err.ids.push({
            id: `address`,
            message: 'address not valid',
        });

    if(!sec_1.dated)
        err.ids.push({
            id: `dated`,
            message: 'Date not valid',
        });    
    
    let sec_3 = {
        balance: +$('#debit').val(),
        advance: +$('#credit').val(),
        total: +$('#gross_total').val(),
    };

    let xtra = {
        added_by: localStorage.getItem('mail_id') || '',
        updated_on: new Date().getTime(),
        bill_id: is_edit_page() ? localStorage.getItem('selected_bill_id') : '',
    }

    let sec_2 = { items: [] };

    for(let i=1; i<=row_ctr; ++i) {
        if(removed.indexOf(i) === -1) {
            let desc = $(`#desc_${i}`).val();
            // skip if indexing is not contigous!
            if(desc === undefined) continue;
            if(!validate.desc(desc)) {
                err.ids.push({
                    id: `desc_${i}`,
                    message: 'description not valid',
                });
            }
            sec_2.items.push({
                description: desc,
                quantity: $(`#qty_${i}`).val(),
                rate: $(`#rate_${i}`).val(),
                amount: $(`#amount_${i}`).val(),
                item_id: get_item_id(i),
            });
        }
    }

    return {
        ...xtra,
        ...sec_1, 
        ...sec_2,
        ...sec_3, 
    }

}

function show_errs() {
    let errlist = $('#error_list');
    errlist.html('');
    err.ids.forEach(obj => {
        $(`#${obj.id}`).addClass('is-invalid');
        let li = $(`<li>${obj.message}</li>`);
        li.attr('id', `li_${obj.id}`);
        errlist.append(li);
    });
    errlist.removeClass('d-none');
}

function rem_from_errs(id) {
    update_err_list(id);
    err.ids = err.ids.filter(obj => obj.id !== id);
}

function remove_err(e) {
    handle_e(e);
    let target = $(e.target);
    target.removeClass('is-invalid');
    rem_from_errs(target.attr('id'));
}

function update_err_list(id) {
    let errlist = $('#error_list'), f=[];
    errlist.children().each((_, el) => {
        el = $(el);
        el.attr('id').includes(id) && el.remove();
    });
}

function try_uploading(api_fix, xtra_data) {
    let data = try_get_bill_data();
    //console.log('original data:', {...data});
    if(err.ids.length) {
        console.log('Error?:', {...err});
        show_errs();
        return;
    }
    if(is_edit_page()) {
        data['new_inserts'] = data.items.filter(item => item.item_id === 0);
        data.items = data.items.filter(item => item.item_id !== 0);
    }
    //console.log('uploading... Data:', data);
    $.ajax({ 
        type: 'POST', 
        url: `${get_api_base()}/${api_fix}`, 
        data: JSON.stringify({...data, ...xtra_data}),
        beforeSend: get_before_send(),
        contentType: 'application/json',
        dataType: 'json',
        success: data => {
            console.log('success');
            if(!data.error){
                console.log('data received', data);
            } else {
                console.log('error:', data.error)
            }
            
        }
    });
}
