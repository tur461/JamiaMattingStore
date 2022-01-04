let submit = document.getElementById("submit");
let mail = document.getElementById("mail_id");
let pass = document.getElementById("pass_code");

submit.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!mail.value || !pass.value) {
        alert("Please fill in all details");
        return;
    }

    fetch("http://localhost:8888/api/auth_user", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        mail_id: mail.value,
        pass_code: pass.value,
        }),
    })
    .then((res) => res.json())
    .then((data) => {
        console.log(data);
        localStorage.setItem("token", data.token);
        window.location.href = '/index.html';
    })
    .catch((err) => console.log(err));
});