$(document).ready(_ => {
    reset_vars(PAGE.VIEW);
    $.ajax({ 
        type: 'GET', 
        url: `${get_api_base()}/bill_by_id`, 
        data: {bill_id: localStorage.getItem('selected_bill_id')},
        beforeSend: get_before_send(),
        contentType: 'application/json',
        dataType: 'json',
        success: data => {
            console.log('success');
            if(!data.error){
                console.log('data received');
                populate(data.bill);
            } else {
                console.log('error:', data.error)
            }
            
        }
    });

    $('#print_bill').on('click', e => {
        handle_e(e);
        console.log('trying printing the bill...');
        print_the_bill();
    });
});

function get_row_item(item, i) {
    let row = $('<tr>')
    row.attr('id', `item_${i}`);
    
    let desc = $('<td>');
    desc.attr({
        'id': `desc_${i}`,
        'colspan': '4'
    });
    desc.html(item.description);
    
    let qty = $('<td>');
    qty.attr({
        'id': `qty_${i}`,
        'colspan': '1'
    });
    qty.html(item.quantity);
    
    let rate = $('<td>');
    rate.attr({
        'id': `rate_${i}`,
        'colspan': '2'
    });
    rate.html(item.rate);
    
    let amount = $('<td>');
    amount.attr({
        'id': `amount_${i}`,
        'colspan': '3'
    });
    amount.html(item.amount);

    row.append(desc);
    row.append(qty);
    row.append(rate);
    row.append(amount);

    return row;
}

function populate(bill) {
    $('#name').html(bill.name);
    $('#debit').html(bill.balance);
    $('#credit').html(bill.advance);
    $('#address').html(bill.address);
    $('#gross_total').html(bill.total);
    $('#bill_number').html(bill.bill_number);
    $('#dated').html(format_date_local(bill.dated));
    let container = $('#bill_items_container');
    bill.items.forEach((item, i) => container.prepend(get_row_item(item, i+1)));
}

function get_print_font() {
    original_font_size = parseFloat(window.getComputedStyle(document.documentElement).fontSize);
    return {
        size: original_font_size + (original_font_size * print_font_inc),
        family: '',
    }
}

function set_print_format() {
    let font = get_print_font();
    
    $('html').css('font-size', `${font.size}px`);
    $('.no-print--content').each((_, elm) => $(elm).addClass('no-print--style'));
    $('.no-print--border').each((_, elm) => $(elm).addClass('no--border'));
}

function reset_print_format() {
    $('html').css('font-size', `${original_font_size}px`);
    $('.no-print--content').each((_, elm) => $(elm).removeClass('no-print--style'));
    $('.no-print--border').each((_, elm) => $(elm).removeClass('no--border'));
}

function print_the_bill() { 
    set_print_format();
    window.print();
    reset_print_format()
}