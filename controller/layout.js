document.addEventListener('DOMContentLoaded', () => {
    fetch('./header.html')
        .then(res => res.text())
        .then(data => {
            const header = document.getElementById('header-placeholder');
            if (header) {
                header.innerHTML = data;
            }
        });

    fetch('./footer.html')
        .then(res => res.text())
        .then(data => {
            const footer = document.getElementById('footer-placeholder');
            if (footer) {
                footer.innerHTML = data;
            }
        });
});
