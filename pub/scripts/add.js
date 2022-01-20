$(document).ready(_ => {
    reset_vars(PAGE.ADD);
    $('#upload_bill').on('click', e => {
        console.log('uploading from add page');
        try_uploading('add_bill', {}); 
     });
    
})