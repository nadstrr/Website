function createFireworks() {
    const container = document.getElementById('fireworks-container');
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#FF69B4'];
    
    // Create multiple firework bursts
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const centerX = 50 + (Math.random() - 0.5) * 20;
            const centerY = 50 + (Math.random() - 0.5) * 20;
            
            // Create particles for this firework
            for (let j = 0; j < 30; j++) {
                const particle = document.createElement('div');
                particle.className = 'firework';
                particle.style.left = centerX + '%';
                particle.style.top = centerY + '%';
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                
                const angle = (Math.PI * 2 * j) / 30;
                const velocity = 50 + Math.random() * 50;
                const x = Math.cos(angle) * velocity;
                const y = Math.sin(angle) * velocity;
                
                particle.style.setProperty('--x', x + 'px');
                particle.style.setProperty('--y', y + 'px');
                particle.style.animation = `firework ${0.8 + Math.random() * 0.4}s ease-out forwards`;
                
                container.appendChild(particle);
                
                // Remove particle after animation
                setTimeout(() => {
                    particle.remove();
                }, 1200);
            }
        }, i * 200);
    }
}

function checkNumber() {
    const input = document.getElementById('numberInput');
    const result = document.getElementById('result');
    const number = parseInt(input.value);
    let isSpecial = false;

    if (number === 67) {
        result.textContent = "slay qween";
        isSpecial = true;
    } else if (number === 666) {
        result.textContent = "satan detected";
        isSpecial = true;
    } else if (number === 42) {
        result.textContent = "meaning of life found";
        isSpecial = true;
    } else if (number === 420) {
        result.textContent = "420 blaze it";
        isSpecial = true;
    } else if (number === 69) {
        result.textContent = "boring";
        isSpecial = true;
    } else if (number === 789) {
        result.textContent = "maybe 7 isnt so lucky if its doing that";
        isSpecial = true;
    } else {
        result.textContent = "wrong! choose again";
    }
    
    // Trigger dance animation
    input.classList.add('dance');
    setTimeout(() => {
        input.classList.remove('dance');
    }, 600);
    
    // Trigger fireworks for special numbers
    if (isSpecial) {
        createFireworks();
    }
}

// Add Enter key support
document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('numberInput');
    input.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            checkNumber();
        }
    });
});
