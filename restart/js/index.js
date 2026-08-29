document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const screen = document.querySelector('.restart-screen');
        screen.style.opacity = '0';
        
        setTimeout(() => {
            window.location.href = './boot';
        }, 1000);
    }, 6000);
});