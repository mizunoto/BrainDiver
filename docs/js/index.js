// js/index.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('隔絶輪廻のブレインダイバー: ランディングページへようこそ！');

    // Example: Add a class to body after content loads for a subtle fade-in effect via CSS
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);

    // Simple active link highlighting (can be made more robust if needed)
    const currentPath = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});