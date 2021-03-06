$(document).ready(function(){
    window._bills = null;
    window._old_data = null;
    window._search_by = 1; // default: name
    window._threshold = 2; // chars
    window._timing = 300; // ms
    window._timer = null;
    
    do_fetch({api_suffix: 'bills_agregate', data: {}});
    do_fetch({api_suffix: 'bills', data: {}});
        
    function do_fetch(opts) {
        // console.log(opts);
        $.ajax({ 
            type: 'GET', 
            url: `${get_api_base()}/${opts.api_suffix}`, 
            data: opts.data,
            beforeSend: get_before_send(),
            contentType: 'application/json',
            dataType: 'json',
            success: data => {
                if(!data.error){
                    console.log('data receive success!');
                    if(opts.api_suffix == 'bills_agregate') {
                        $('#total-debit').text(format_amount(data.total_debit));
                        $('#total-credit').text(format_amount(data.total_credit));
                        return;
                    }
                    window._bills = data.bills;
                    if(opts.api_suffix == 'bills') window._old_data = data.bills;
                    insert_bills(data.bills);
                } else {
                    console.log('error:', data.error)
                }
                
            }
        });
    }

    function insert_bills(bills) {
        let bills_container = $('#all_bills-container');
        bills_container.html('');
        let btn_onclick = e => {
            handle_e(e);
            localStorage.setItem('selected_bill_id', $(e.target).data('bid'));
            $(location).attr('href','/edit.html');
        };
        let bill_onclick = e => {
            handle_e(e);
            let t = $(e.target);
            let bill_id = t.is('div') ? t.data('bid') : t.parent().data('bid');
            localStorage.setItem('selected_bill_id', bill_id);
            $(location).attr('href','/view.html');
        };

        $.each(bills, (i, bill) => {
            let div = $("<div/>").attr('class','bill');
            div.on('click', bill_onclick);
            let span = $("<span/>").attr('class','bill_name').html('Name: ' + bill.name);   
            div.append(span);
            span = $("<span/>").attr('class','bill_number').html('Bill No.: ' + bill.bill_number);   
            div.append(span);
            let btn = $("<button/>").attr('class','btn btn-primary bill_edit').html('Edit');
            btn.on('click', btn_onclick);
            btn.data('bid', bill.bill_id);
            div.append(btn)            
            div.data('bid', bill.bill_id);
            bills_container.append(div);
        });
    }

    $('#search_by').on('change', e => {
        window._search_by = +e.target.value;
    })

    function proceed_for_search(text) {
        if(text.length >= window._threshold) {
            //console.log('searching: ' + text);
            let opts = {api_suffix: 'bills_by_name', data: {}};
            if(window._search_by == 1) {
                opts.data['name'] = text;
                do_fetch(opts);
            } else {
                opts.api_suffix = 'bills_by_bill_number';
                opts.data['bill_number'] = text;
                do_fetch(opts);
            } 
        }
    }

    $('#search_box').on('keyup', e => {
        if(window._timer){
            //console.log('clearing timeout: ' + window._timer);
            clearTimeout(window._timer);
        }
        let text = $('#search_box').val();
        if(text.length >= window._threshold) {
            // set new timer
            window._timer = setTimeout(_ => {
                proceed_for_search(text);
            }, window._timing);
        } else {
            insert_bills(window._old_data);
        }
    })
})