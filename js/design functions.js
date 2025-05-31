
function drawEnhancedWaveform() {
    const centerY = this.canvas.height / 2;
    const sensitivity = document.getElementById('sensitivity').value / 100;
    const smoothing = document.getElementById('smoothing').checked;
    const glow = document.getElementById('glow').checked;
    
    // Multiple waveform layers for depth
    for (let layer = 0; layer < 3; layer++) {
        this.ctx.lineWidth = 6 - layer * 2;
        this.ctx.beginPath();
        
        const sliceWidth = this.canvas.width / this.dataArray.length;
        let x = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            let v = this.dataArray[i] / 128.0;
            v = Math.pow(v, 1.5) * sensitivity; // Non-linear scaling for better visuals
            
            if (smoothing && this.previousData) {
                v = this.previousData[i] * 0.7 + v * 0.3; // Smooth transitions
                this.previousData[i] = v;
            }
            
            const amplitude = v * (this.canvas.height / 4) * (1 + layer * 0.3);
            const y = centerY + Math.sin(x * 0.01 + this.time + layer) * amplitude * 0.2 + // Add wave motion
                        amplitude * Math.sin(i * 0.1 + this.time * 2 + layer * Math.PI / 3);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        
        const avgIntensity = this.dataArray.reduce((a, b) => a + b) / this.dataArray.length / 255;
        const color = this.getColor(layer, 3, avgIntensity);
        this.ctx.strokeStyle = color;
        
        if (glow) {
            this.ctx.shadowBlur = 20 + layer * 10;
            this.ctx.shadowColor = color;
        }
        
        this.ctx.stroke();
    }
    
    if (!this.previousData) {
        this.previousData = new Float32Array(this.dataArray.length);
    }
}

function drawSpectralBars() {
    const sensitivity = document.getElementById('sensitivity').value / 100;
    const glow = document.getElementById('glow').checked;
    const barWidth = this.canvas.width / this.dataArray.length * 2.5;
    
    for (let i = 0; i < this.dataArray.length; i++) {
        const barHeight = (this.dataArray[i] / 255) * this.canvas.height * 0.9 * sensitivity;
        const intensity = this.dataArray[i] / 255;
        const x = i * (barWidth + 1);
        
        // Create gradient for each bar
        const gradient = this.ctx.createLinearGradient(0, this.canvas.height, 0, this.canvas.height - barHeight);
        const color1 = this.getColor(i, this.dataArray.length, intensity);
        const color2 = this.getColor(i, this.dataArray.length, intensity * 0.3);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        this.ctx.fillStyle = gradient;
        
        if (glow) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = color1;
        }
        
        // Main bar
        this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
        
        // Reflection
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillRect(x, this.canvas.height, barWidth, barHeight * 0.5);
        this.ctx.globalAlpha = 1;
    }
}

function drawRadialSpectrum() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.3;
    const sensitivity = document.getElementById('sensitivity').value / 100;
    const glow = document.getElementById('glow').checked;
    
    // Draw multiple concentric circles
    for (let ring = 0; ring < 3; ring++) {
        const radius = baseRadius + ring * 80;
        
        for (let i = 0; i < this.dataArray.length; i += 2) {
            const angle = (i / this.dataArray.length) * Math.PI * 2;
            const barHeight = (this.dataArray[i] / 255) * 100 * sensitivity;
            const intensity = this.dataArray[i] / 255;
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);
            
            this.ctx.strokeStyle = this.getColor(i + ring * 50, this.dataArray.length, intensity);
            this.ctx.lineWidth = 6;
            
            if (glow) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = this.getColor(i + ring * 50, this.dataArray.length, intensity);
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
    }
}

function drawParticleExplosion() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const sensitivity = document.getElementById('sensitivity').value / 100;
    const avgVolume = this.dataArray.reduce((a, b) => a + b) / this.dataArray.length;
    
    // Add particles based on frequency data
    for (let i = 0; i < this.dataArray.length; i += 8) {
        const intensity = this.dataArray[i] / 255;
        if (intensity > 0.3 && this.particles.length < 400) {
            const angle = (i / this.dataArray.length) * Math.PI * 2;
            const speed = intensity * 15 * sensitivity;
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.005 + Math.random() * 0.01,
                size: 2 + intensity * 6,
                color: this.getColor(i, this.dataArray.length, intensity),
                trail: []
            });
        }
    }
    
    // Update and draw particles with trails
    for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        
        // Add to trail
        p.trail.push({ x: p.x, y: p.y, life: p.life });
        if (p.trail.length > 10) p.trail.shift();
        
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.vx *= 0.99;
        p.vy *= 0.99;
        
        if (p.life <= 0) {
            this.particles.splice(i, 1);
            continue;
        }
        
        // Draw trail
        for (let j = 0; j < p.trail.length - 1; j++) {
            const alpha = (j / p.trail.length) * p.life * 0.5;
            this.ctx.globalAlpha = alpha;
            this.ctx.strokeStyle = p.color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(p.trail[j].x, p.trail[j].y);
            this.ctx.lineTo(p.trail[j + 1].x, p.trail[j + 1].y);
            this.ctx.stroke();
        }
        
        // Draw particle
        this.ctx.globalAlpha = p.life;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
}

function drawGeometricMatrix() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const sensitivity = document.getElementById('sensitivity').value / 100;
    const glow = document.getElementById('glow').checked;
    
    // Create a grid of reactive points
    const gridSize = 20;
    const spacing = Math.min(this.canvas.width, this.canvas.height) / gridSize;
    
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const px = (x - gridSize/2) * spacing + centerX;
            const py = (y - gridSize/2) * spacing + centerY;
            
            const dataIndex = Math.floor((x + y) * this.dataArray.length / (gridSize * 2));
            const intensity = this.dataArray[dataIndex] / 255 * sensitivity;
            
            if (intensity > 0.1) {
                const size = 3 + intensity * 15;
                const color = this.getColor(dataIndex, this.dataArray.length, intensity);
                
                this.ctx.fillStyle = color;
                if (glow) {
                    this.ctx.shadowBlur = 20;
                    this.ctx.shadowColor = color;
                }
                
                this.ctx.beginPath();
                this.ctx.arc(px, py, size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Connect to nearby active points
                for (let nx = Math.max(0, x-1); nx <= Math.min(gridSize-1, x+1); nx++) {
                    for (let ny = Math.max(0, y-1); ny <= Math.min(gridSize-1, y+1); ny++) {
                        if (nx === x && ny === y) continue;
                        
                        const nDataIndex = Math.floor((nx + ny) * this.dataArray.length / (gridSize * 2));
                        const nIntensity = this.dataArray[nDataIndex] / 255 * sensitivity;
                        
                        if (nIntensity > 0.1) {
                            const npx = (nx - gridSize/2) * spacing + centerX;
                            const npy = (ny - gridSize/2) * spacing + centerY;
                            
                            this.ctx.strokeStyle = color;
                            this.ctx.lineWidth = intensity * 3;
                            this.ctx.globalAlpha = intensity * 0.5;
                            this.ctx.beginPath();
                            this.ctx.moveTo(px, py);
                            this.ctx.lineTo(npx, npy);
                            this.ctx.stroke();
                        }
                    }
                }
            }
        }
    }
    
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
}