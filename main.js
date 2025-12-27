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
     } else if (number ===21) {
        result.textContent = "we get it, you know how to count";
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

// Sun animation with collision detection
class Sun {
    constructor(element) {
        this.element = element;
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.vx = (Math.random() - 0.5) * 4; // Faster speed
        this.vy = (Math.random() - 0.5) * 4;
        this.size = 80; // Approximate size of sun emoji
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 5;
    }

    update() {
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        // Bounce off screen edges
        if (this.x < 0 || this.x > window.innerWidth - this.size) {
            this.vx = -this.vx;
            this.x = Math.max(0, Math.min(window.innerWidth - this.size, this.x));
        }
        if (this.y < 0 || this.y > window.innerHeight - this.size) {
            this.vy = -this.vy;
            this.y = Math.max(0, Math.min(window.innerHeight - this.size, this.y));
        }

        // Check collision with image
        const image = document.getElementById('henryImage');
        if (image) {
            const imageRect = image.getBoundingClientRect();
            const sunRect = {
                left: this.x,
                top: this.y,
                right: this.x + this.size,
                bottom: this.y + this.size
            };

            // Check if sun overlaps with image (using getBoundingClientRect which accounts for scroll)
            if (sunRect.left < imageRect.right &&
                sunRect.right > imageRect.left &&
                sunRect.top < imageRect.top + imageRect.height &&
                sunRect.bottom > imageRect.top) {
                
                // Calculate collision direction and bounce
                const sunCenterX = this.x + this.size / 2;
                const sunCenterY = this.y + this.size / 2;
                const imageCenterX = imageRect.left + imageRect.width / 2;
                const imageCenterY = imageRect.top + imageRect.height / 2;

                const dx = sunCenterX - imageCenterX;
                const dy = sunCenterY - imageCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 0) {
                    // Normalize direction
                    const nx = dx / distance;
                    const ny = dy / distance;

                    // Reflect velocity
                    const dot = this.vx * nx + this.vy * ny;
                    this.vx = this.vx - 2 * dot * nx;
                    this.vy = this.vy - 2 * dot * ny;

                    // Add some randomness to make it more interesting
                    this.vx += (Math.random() - 0.5) * 1;
                    this.vy += (Math.random() - 0.5) * 1;

                    // Push sun away from image
                    this.x += nx * 5;
                    this.y += ny * 5;
                }
            }
        }

        // Update DOM
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        this.element.style.transform = `rotate(${this.rotation}deg)`;
    }
}

let suns = [];
let animationId;

function animateSuns() {
    suns.forEach(sun => sun.update());
    animationId = requestAnimationFrame(animateSuns);
}

function initSuns() {
    const sunElements = document.querySelectorAll('#background-suns .sun');
    suns = Array.from(sunElements).map((element, index) => {
        const sun = new Sun(element);
        // Set initial positions
        sun.x = (index % 3) * (window.innerWidth / 3) + Math.random() * 100;
        sun.y = Math.floor(index / 3) * (window.innerHeight / 2) + Math.random() * 100;
        return sun;
    });
    animateSuns();
}

// Handle window resize
window.addEventListener('resize', () => {
    suns.forEach(sun => {
        sun.x = Math.min(sun.x, window.innerWidth - sun.size);
        sun.y = Math.min(sun.y, window.innerHeight - sun.size);
    });
});

// Add Enter key support
document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('numberInput');
    input.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            checkNumber();
        }
    });
    
    // Initialize sun animation after a short delay to ensure image is loaded
    setTimeout(initSuns, 100);
});
