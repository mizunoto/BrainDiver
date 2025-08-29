document.addEventListener('DOMContentLoaded', () => {
    console.log('Brain Diver Landing Page Loaded.');

    // Example: Add a simple hover effect to link cards if not already handled by CSS
    const linkCards = document.querySelectorAll('.link-card');
    linkCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Add a class for JS-specific effects, if needed, beyond CSS :hover
            // card.classList.add('hover-active');
        });
        card.addEventListener('mouseleave', () => {
            // card.classList.remove('hover-active');
        });
    });
});
