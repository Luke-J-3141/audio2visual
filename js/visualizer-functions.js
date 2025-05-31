// Enhanced Waveform Visualization
function drawEnhancedWaveform(ctx, dataArray, canvasWidth, canvasHeight, getColor, time, previousData, sensitivity, smoothing, glow) {
    const centerY = canvasHeight / 2;
    
    // Multiple waveform layers for depth
    for (let layer = 0; layer < 3; layer++) {
        ctx.lineWidth = 6 - layer * 2;
        ctx.beginPath();
        
        const sliceWidth = canvasWidth / dataArray.length;
        let x = 0;
        
        for (let i = 0; i < dataArray.length; i++) {
            let v = dataArray[i] / 128.0;
            v = Math.pow(v, 1.5) * sensitivity; // Non-linear scaling for better visuals
            
            if (smoothing && previousData) {
                v = previousData[i] * 0.7 + v * 0.3; // Smooth transitions
                previousData[i] = v;
            }
            
            const amplitude = v * (canvasHeight / 4) * (1 + layer * 0.3);
            const y = centerY + Math.sin(x * 0.01 + time + layer) * amplitude * 0.2 + // Add wave motion
                        amplitude * Math.sin(i * 0.1 + time * 2 + layer * Math.PI / 3);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        
        const avgIntensity = dataArray.reduce((a, b) => a + b) / dataArray.length / 255;
        const color = getColor(layer, 3, avgIntensity);
        ctx.strokeStyle = color;
        
        if (glow) {
            ctx.shadowBlur = 20 + layer * 10;
            ctx.shadowColor = color;
        }
        
        ctx.stroke();
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

// Spectral Bars Visualization
function drawSpectralBars(ctx, dataArray, canvasWidth, canvasHeight, getColor, time, sensitivity, glow) {
    const barWidth = canvasWidth / dataArray.length * 2.5;
    
    for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvasHeight * 0.9 * sensitivity;
        const intensity = dataArray[i] / 255;
        const x = i * (barWidth + 1);
        
        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(0, canvasHeight, 0, canvasHeight - barHeight);
        const color1 = getColor(i, dataArray.length, intensity);
        const color2 = getColor(i, dataArray.length, intensity * 0.3);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.fillStyle = gradient;
        
        if (glow) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = color1;
        }
        
        // Main bar
        ctx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight);
        
        // Reflection
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x, canvasHeight, barWidth, barHeight * 0.5);
        ctx.globalAlpha = 1;
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

// Radial Spectrum Visualization
function drawRadialSpectrum(ctx, dataArray, canvasWidth, canvasHeight, getColor, time, sensitivity, glow) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.3;
    
    // Draw multiple concentric circles
    for (let ring = 0; ring < 3; ring++) {
        const radius = baseRadius + ring * 80;
        
        for (let i = 0; i < dataArray.length; i += 2) {
            const angle = (i / dataArray.length) * Math.PI * 2;
            const barHeight = (dataArray[i] / 255) * 100 * sensitivity;
            const intensity = dataArray[i] / 255;
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);
            
            ctx.strokeStyle = getColor(i + ring * 50, dataArray.length, intensity);
            ctx.lineWidth = 6;
            
            if (glow) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = getColor(i + ring * 50, dataArray.length, intensity);
            }
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

// Particle Explosion Visualization
function drawParticleExplosion(ctx, dataArray, canvasWidth, canvasHeight, getColor, time, particles, sensitivity) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const avgVolume = dataArray.reduce((a, b) => a + b) / dataArray.length;
    
    // Add particles based on frequency data
    for (let i = 0; i < dataArray.length; i += 8) {
        const intensity = dataArray[i] / 255;
        if (intensity > 0.3 && particles.length < 400) {
            const angle = (i / dataArray.length) * Math.PI * 2;
            const speed = intensity * 15 * sensitivity;
            
            particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.005 + Math.random() * 0.01,
                size: 2 + intensity * 6,
                color: getColor(i, dataArray.length, intensity),
                trail: []
            });
        }
    }
    
    // Update and draw particles with trails
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Add to trail
        p.trail.push({ x: p.x, y: p.y, life: p.life });
        if (p.trail.length > 10) p.trail.shift();
        
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.vx *= 0.99;
        p.vy *= 0.99;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        // Draw trail
        for (let j = 0; j < p.trail.length - 1; j++) {
            const alpha = (j / p.trail.length) * p.life * 0.5;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.trail[j].x, p.trail[j].y);
            ctx.lineTo(p.trail[j + 1].x, p.trail[j + 1].y);
            ctx.stroke();
        }
        
        // Draw particle
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// Geometric Matrix Visualization
function drawGeometricMatrix(ctx, dataArray, canvasWidth, canvasHeight, getColor, time, sensitivity, glow) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Create a grid of reactive points
    const gridSize = 20;
    const spacing = Math.min(canvasWidth, canvasHeight) / gridSize;
    
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const px = (x - gridSize/2) * spacing + centerX;
            const py = (y - gridSize/2) * spacing + centerY;
            
            const dataIndex = Math.floor((x + y) * dataArray.length / (gridSize * 2));
            const intensity = dataArray[dataIndex] / 255 * sensitivity;
            
            if (intensity > 0.1) {
                const size = 3 + intensity * 15;
                const color = getColor(dataIndex, dataArray.length, intensity);
                
                ctx.fillStyle = color;
                if (glow) {
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = color;
                }
                
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();
                
                // Connect to nearby active points
                for (let nx = Math.max(0, x-1); nx <= Math.min(gridSize-1, x+1); nx++) {
                    for (let ny = Math.max(0, y-1); ny <= Math.min(gridSize-1, y+1); ny++) {
                        if (nx === x && ny === y) continue;
                        
                        const nDataIndex = Math.floor((nx + ny) * dataArray.length / (gridSize * 2));
                        const nIntensity = dataArray[nDataIndex] / 255 * sensitivity;
                        
                        if (nIntensity > 0.1) {
                            const npx = (nx - gridSize/2) * spacing + centerX;
                            const npy = (ny - gridSize/2) * spacing + centerY;
                            
                            ctx.strokeStyle = color;
                            ctx.lineWidth = intensity * 3;
                            ctx.globalAlpha = intensity * 0.5;
                            ctx.beginPath();
                            ctx.moveTo(px, py);
                            ctx.lineTo(npx, npy);
                            ctx.stroke();
                        }
                    }
                }
            }
        }
    }
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// Spiral Galaxy Visualization
function drawSpiralGalaxy(ctx, dataArray, canvasWidth, canvasHeight, getColor, time, sensitivity, glow) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.8;
    
    // Draw multiple spiral arms
    for (let arm = 0; arm < 4; arm++) {
        const armOffset = (arm / 4) * Math.PI * 2;
        
        for (let i = 0; i < dataArray.length; i += 3) {
            const intensity = dataArray[i] / 255 * sensitivity;
            if (intensity < 0.1) continue;
            
            const radius = (i / dataArray.length) * maxRadius;
            const angle = armOffset + (radius / maxRadius) * Math.PI * 6 + time * 0.5;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            const size = 2 + intensity * 8;
            const color = getColor(i + arm * 64, dataArray.length, intensity);
            
            ctx.fillStyle = color;
            if (glow) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = color;
            }
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add trailing effect
            if (i > 0) {
                const prevRadius = ((i - 3) / dataArray.length) * maxRadius;
                const prevAngle = armOffset + (prevRadius / maxRadius) * Math.PI * 6 + time * 0.5;
                const prevX = centerX + Math.cos(prevAngle) * prevRadius;
                const prevY = centerY + Math.sin(prevAngle) * prevRadius;
                
                ctx.strokeStyle = color;
                ctx.lineWidth = intensity * 2;
                ctx.globalAlpha = intensity * 0.6;
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        }
    }
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// Warp Tunnel Visualization
function drawWarpTunnel(ctx, dataArray, canvasWidth, canvasHeight, getColor, time, sensitivity, glow) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const maxRadius = Math.min(centerX, centerY);
    
    // Draw tunnel rings moving towards viewer
    for (let ring = 0; ring < 15; ring++) {
        const ringTime = time * 5 + ring * 0.5;
        const z = (ringTime % 10) / 10; // 0 to 1, cycling
        const radius = maxRadius * (1 - z) * 0.8;
        
        if (radius < 10) continue;
        
        const segments = 32;
        const dataStep = Math.floor(dataArray.length / segments);
        
        ctx.beginPath();
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const dataIndex = i * dataStep;
            const intensity = dataArray[dataIndex] / 255 * sensitivity;
            
            const waveRadius = radius + intensity * 50 * (1 - z);
            const x = centerX + Math.cos(angle) * waveRadius;
            const y = centerY + Math.sin(angle) * waveRadius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        
        const avgIntensity = dataArray.reduce((a, b) => a + b) / dataArray.length / 255;
        const color = getColor(ring * 16, 240, avgIntensity * (1 - z));
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3 * (1 - z);
        ctx.globalAlpha = (1 - z) * 0.8;
        
        if (glow) {
            ctx.shadowBlur = 20 * (1 - z);
            ctx.shadowColor = color;
        }
        
        ctx.stroke();
        
        // Add inner glow lines
        if (z < 0.8) {
            for (let i = 0; i < segments; i += 4) {
                const angle = (i / segments) * Math.PI * 2;
                const dataIndex = i * dataStep;
                const intensity = dataArray[dataIndex] / 255 * sensitivity;
                
                if (intensity > 0.3) {
                    const innerRadius = radius * 0.7;
                    const outerRadius = radius + intensity * 30;
                    
                    const x1 = centerX + Math.cos(angle) * innerRadius;
                    const y1 = centerY + Math.sin(angle) * innerRadius;
                    const x2 = centerX + Math.cos(angle) * outerRadius;
                    const y2 = centerY + Math.sin(angle) * outerRadius;
                    
                    ctx.strokeStyle = getColor(dataIndex, dataArray.length, intensity);
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            }
        }
    }
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}