
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