document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const screen = document.querySelector('.restart-screen');
        const blackScreen = document.querySelector('.black-screen');
        
        screen.classList.add('fade-out');
        blackScreen.style.display = 'block';
        
        setTimeout(() => {
            window.location.href = '../../boot';
        }, 1000);
    }, 6000);
});