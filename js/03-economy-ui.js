/**
 * js/03-economy-ui.js
 * 3-Sector Economy Simulation & Canvas Engines
 */

class KitchenSceneCanvas {
    constructor() {
        this.canvas = document.getElementById('kitchenSceneCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.chefX = 50;
        this.scooterX = 50;
        this.elevatorY = 30;
        this.direction = 1;

        if (this.canvas) {
            this.animate();
        }
    }

    animate() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.fillRect(0, 120, this.canvas.width, 40);

        this.chefX += 1.2 * this.direction;
        if (this.chefX > 220 || this.chefX < 30) this.direction *= -1;

        this.ctx.font = '28px sans-serif';
        this.ctx.fillText('👨‍🍳', this.chefX, 110);
        this.ctx.fillText('🍲', 140, 110);
        this.ctx.fillText('🍜', 280, 110);

        this.elevatorY += 0.8 * this.direction;
        this.ctx.fillStyle = 'rgba(255, 184, 0, 0.2)';
        this.ctx.fillRect(380, 20, 40, 120);
        this.ctx.fillText('🛗', 386, 40 + (Math.sin(Date.now() / 300) * 40 + 40));

        this.scooterX = (this.scooterX + 2) % (this.canvas.width - 80);
        this.ctx.fillText('🛵💨', 450 + (this.scooterX / 3), 110);

        requestAnimationFrame(() => this.animate());
    }
}

class ParticleCanvasEngine {
    constructor() {
        this.canvas = document.getElementById('bgParticleCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.particles = [];
        this.activeTheme = 'cyberpunk';

        if (this.canvas) {
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.initParticles();
            this.animate();
        }
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setTheme(theme) {
        this.activeTheme = theme;
        this.initParticles();
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 3 + 2,
                speedY: Math.random() * 1.5 + 0.5,
                speedX: (Math.random() - 0.5) * 0.8,
                opacity: Math.random() * 0.6 + 0.2
            });
        }
    }

    animate() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;
            if (p.y > this.canvas.height) { p.y = -10; p.x = Math.random() * this.canvas.width; }

            this.ctx.save();
            this.ctx.globalAlpha = p.opacity;

            if (this.activeTheme === 'cyberpunk') {
                this.ctx.fillStyle = '#00F2FE';
                this.ctx.fillRect(p.x, p.y, 2, p.size * 4);
            } else if (this.activeTheme === 'cozy') {
                this.ctx.fillStyle = '#EC4899';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = '#D97706';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        });

        requestAnimationFrame(() => this.animate());
    }
}
