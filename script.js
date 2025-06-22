document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.side-nav .nav-item');
    const page = window.location.pathname.split('/').pop();
    navItems.forEach((item, idx) => {
        // Sayfa adını projectX.html olarak varsayalım
        const pageName = `project${idx+1}.html`;
        if ((page === '' && idx === 0) || page === pageName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
        item.addEventListener('click', () => {
            window.location.href = pageName;
        });
    });
});
