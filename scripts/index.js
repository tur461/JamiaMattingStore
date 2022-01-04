$(document).ready(function(){
    window._items = null;
    window._old_data = null;
    window._search_by = 1; // default: name
    window._threshold = 2; // chars
    window._timing = 300; // ms
    window._timer = null;
    
    fetch_items({api_suffix: 'items', data: {}});
        
    function fetch_items(opts) {
        console.log(opts);
        $.ajax({ 
            type: 'GET', 
            url: `${get_api_base()}/${opts.api_suffix}`, 
            data: opts.data,
            beforeSend: get_before_send(),
            contentType: 'application/json',
            dataType: 'json',
            success: data => {
                if(!data.error){
                    console.log('data received:', data.items.length)
                    window._items = data.items;
                    if(opts.api_suffix == 'items') window._old_data = data.items;
                    insert_items(data.items);
                } else {
                    console.log('error:', data.error)
                }
                
            }
        });
    }

    function insert_items(items) {
        let items_container = $('#all_items-container');
        items_container.html('');
        let btn_onclick = e => {
            e.preventDefault();
            e.stopPropagation();
            $(location).attr('href','/edit.html');
        };
        let item_onclick = e => {
            e.preventDefault();
            e.stopPropagation();
            $(location).attr('href','/view.html');
        };

        $.each(items, (i, item) => {
            let div = $("<div/>").attr('class','item');
            div.on('click', item_onclick);
            let span = $("<span/>").attr('class','item_name').html('Name: ' + item.item_name);   
            div.append(span);
            span = $("<span/>").attr('class','bill_number').html('Bill No.: ' + item.bill_number);   
            div.append(span);
            let btn = $("<button/>").attr('class','btn btn-primary item_edit').html('Edit');
            btn.on('click', btn_onclick);
            div.append(btn)            
            items_container.append(div);
        });
    }

    $('#search_by').on('change', e => {
        window._search_by = +e.target.value;
    })

    function proceed_for_search(text) {
        if(text.length >= window._threshold) {
            console.log('searching: ' + text);
            let opts = {api_suffix: 'items_by_name', data: {}};
            if(window._search_by == 1) {
                opts.data['name'] = text;
                fetch_items(opts);
            } else {
                opts.api_suffix = 'items_by_bill_number';
                opts.data['bill_number'] = text;
                fetch_items(opts);
            } 
        }
    }

    $('#search_box').on('keyup', e => {
        if(window._timer){
            console.log('clearing timeout: ' + window._timer);
            clearTimeout(window._timer);
        }
        let text = $('#search_box').val();
        if(text.length >= window._threshold) {
            // set new timer
            window._timer = setTimeout(_ => {
                proceed_for_search(text);
            }, window._timing);
        } else {
            insert_items(window._old_data);
        }
    })
})