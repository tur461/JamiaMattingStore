
    function get_token() {
        return localStorage.getItem('token');
    }

    function get_before_send() {
        return xhr => xhr.setRequestHeader ("Authorization", `Bearer ${get_token()}`);
    }

    function get_api_base() {
        return 'http://localhost:8888/api';
    }

    $('#logout').on('click', e => {
        e.preventDefault();
        e.stopPropagation();
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    })

    function handle_e(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function format_date(timestamp) {
        let dt = new Date(timestamp),
            m = `${dt.getMonth() + 1}`,
            d = `${dt.getDate()}`,
            y = `${dt.getFullYear()}`;
         
            m = m.length < 2 ? '0' + m : m;
            d = d.length < 2 ? '0' + d : d;
    
        return `${y}-${m}-${d}`;
    }


    let validate = (function(){
        let mail = m => {
            return m.match(
                /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
              );
        };
        let name = n => {
            return n.match(/^([\w]{3,})+\s+([\w\s]{3,})+$/i);
        };
        let phone = ph => {
            return ph.match(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/);
        };
        let address = ad => {
            return ad.match(/^[a-zA-Z0-9\s,'-]+/);
        };
        
        let desc = dsc => {
            return dsc.match(/^[A-Za-z\d\s]+$/);
        };

        let bill_num = bn => {
            return bn.match(/^[0-9]{1,6}$/);
        };

        return {
            mail, 
            desc,
            name,
            phone,
            address,
            bill_num,
        }
    })()