$(document).ready(_ => {
    reset_vars(PAGE.EDIT);
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

    $('#upload_bill').on('click', e => {
        console.log('uploading from edit page');
        try_uploading('update_bill_by_id', {removed_item_ids: rem_item_ids}); 
    });

});

function populate(bill) {
    $('#name').val(bill.name);
    $('#dated').val(format_date(bill.dated));
    $('#phone').val(bill.phone);
    $('#debit').val(bill.balance);
    $('#credit').val(bill.advance);
    $('#address').val(bill.address);
    $('#gross_total').val(bill.total);
    $('#bill_number').val(bill.bill_number);
    
    bill.items.forEach((item, i) => {
        if(i>0) add_row();
        $(`#desc_${i+1}`).val(item.description);
        $(`#qty_${i+1}`).val(item.quantity);
        $(`#rate_${i+1}`).val(item.rate);
        $(`#amount_${i+1}`).val(item.amount);

        $(`#item-row_${i+1}`).data('item_id', item.item_id);
    });
}