// Epic Enhanced Waveform Visualization - Maximum Awesome Mode
function drawEnhancedWaveform(ctx, dataArray, canvasWidth, canvasHeight, getColor, time, previousData, sensitivity, smoothing, glow) {
    const centerY = canvasHeight / 2;
    
    // Focus on lower 40% of frequency spectrum for bass emphasis
    const focusLength = Math.floor(dataArray.length * 0.4);
    const focusedData = dataArray.slice(0, focusLength);
    
    // Calculate overall energy for dynamic effects
    const totalEnergy = focusedData.reduce((a, b) => a + b) / focusedData.length / 255;
    const energyBoost = 1 + totalEnergy * 0.8;
    
    // Dynamic background pulse effect
    if (totalEnergy > 0.3) {
        const pulseRadius = totalEnergy * Math.min(canvasWidth, canvasHeight) * 0.4;
        const pulseGradient = ctx.createRadialGradient(
            canvasWidth / 2, centerY, 0,
            canvasWidth / 2, centerY, pulseRadius
        );
        pulseGradient.addColorStop(0, `rgba(${Math.floor(totalEnergy * 255)}, ${Math.floor(totalEnergy * 128)}, ${Math.floor(totalEnergy * 200)}, 0.1)`);
        pulseGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = pulseGradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    
    // Create multiple waveform layers with enhanced effects
    for (let layer = 0; layer < 5; layer++) {
        ctx.lineWidth = Math.max(1, 8 - layer * 1.5);
        ctx.beginPath();
        
        const sliceWidth = canvasWidth / focusedData.length;
        let x = 0;
        
        // Layer-specific properties for variation
        const layerPhase = layer * Math.PI / 2.5;
        const layerSpeed = 1 + layer * 0.3;
        const layerAmplitude = 1 - layer * 0.15;
        
        for (let i = 0; i < focusedData.length; i++) {
            let v = focusedData[i] / 128.0;
            
            // Enhanced non-linear scaling with energy boost
            v = Math.pow(v, 1.2) * sensitivity * 1.8 * energyBoost;
            
            // Advanced smoothing with temporal interpolation
            if (smoothing && previousData && layer === 0) {
                const prevIndex = Math.floor(i * (dataArray.length / focusedData.length));
                const smoothFactor = 0.65 + totalEnergy * 0.2; // Dynamic smoothing
                v = previousData[prevIndex] * smoothFactor + v * (1 - smoothFactor);
                previousData[prevIndex] = v;
            }
            
            // Multi-frequency wave modulation
            const baseAmplitude = v * (canvasHeight / 3.2) * layerAmplitude;
            const waveModulation = Math.sin(x * 0.008 + time * layerSpeed + layerPhase) * baseAmplitude * 0.25;
            const frequencyModulation = Math.sin(i * 0.12 + time * 2.5 + layerPhase) * baseAmplitude;
            const pulseModulation = Math.sin(time * 4 + layer) * totalEnergy * 15;
            
            // Combine all modulations for complex wave patterns
            const y = centerY + waveModulation + frequencyModulation + pulseModulation;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }
        
        // Dynamic color with energy-based intensity
        const avgIntensity = focusedData.reduce((a, b) => a + b) / focusedData.length / 255;
        const enhancedIntensity = Math.min(1, avgIntensity * energyBoost);
        const color = getColor(layer, 5, enhancedIntensity);
        
        // Create gradient stroke for depth
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, 0);
        gradient.addColorStop(0, color);
        // Parse color properly for transparency
        let transparentColor = color;
        if (color.startsWith('rgb(')) {
            transparentColor = color.replace('rgb(', 'rgba(').replace(')', ', 0.9)');
        } else if (color.startsWith('hsl(')) {
            transparentColor = color.replace('hsl(', 'hsla(').replace(')', ', 0.9)');
        }
        gradient.addColorStop(0.5, transparentColor);
        gradient.addColorStop(1, color);
        ctx.strokeStyle = gradient;
        
        // Enhanced glow effects
        if (glow) {
            const glowIntensity = 20 + layer * 8 + totalEnergy * 25;
            ctx.shadowBlur = glowIntensity;
            ctx.shadowColor = color;
            
            // Double glow for outer layers
            if (layer < 2) {
                ctx.save();
                ctx.shadowBlur = glowIntensity * 2;
                // Parse color properly for outer glow
                let outerGlowColor = color;
                if (color.startsWith('rgb(')) {
                    outerGlowColor = color.replace('rgb(', 'rgba(').replace(')', ', 0.3)');
                } else if (color.startsWith('hsl(')) {
                    outerGlowColor = color.replace('hsl(', 'hsla(').replace(')', ', 0.3)');
                }
                ctx.shadowColor = outerGlowColor;
                ctx.stroke();
                ctx.restore();
            }
        }
        
        ctx.stroke();
        
        // Add particle effects for high energy sections
        if (layer === 0 && totalEnergy > 0.4) {
            ctx.save();
            for (let i = 0; i < focusedData.length; i += 8) {
                const intensity = focusedData[i] / 255;
                if (intensity > 0.6) {
                    const particleX = (i / focusedData.length) * canvasWidth;
                    const particleY = centerY + Math.sin(i * 0.12 + time * 2.5) * intensity * (canvasHeight / 3.2);
                    
                    const size = 2 + intensity * 6;
                    ctx.fillStyle = getColor(i, focusedData.length, intensity);
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = getColor(i, focusedData.length, intensity);
                    
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }
        
        // Mirror effect for bottom layer
        if (layer === 4) {
            ctx.save();
            ctx.scale(1, -1);
            ctx.translate(0, -canvasHeight);
            ctx.globalAlpha = 0.3;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.restore();
        }
    }
    
    // Add frequency bands visualization at the bottom
    if (totalEnergy > 0.2) {
        const bandHeight = 30;
        const bandCount = 20;
        const bandWidth = canvasWidth / bandCount;
        
        for (let i = 0; i < bandCount; i++) {
            const dataIndex = Math.floor((i / bandCount) * focusedData.length);
            const intensity = focusedData[dataIndex] / 255;
            const barHeight = intensity * bandHeight * energyBoost;
            
            const gradient = ctx.createLinearGradient(0, canvasHeight - barHeight, 0, canvasHeight);
            gradient.addColorStop(0, getColor(i, bandCount, intensity));
            gradient.addColorStop(1, getColor(i, bandCount, intensity * 0.2));
            
            ctx.fillStyle = gradient;
            ctx.fillRect(i * bandWidth, canvasHeight - barHeight, bandWidth - 1, barHeight);
        }
    }
    
    // Add central energy orb for extreme bass hits
    if (totalEnergy > 0.7) {
        const orbSize = totalEnergy * 40;
        const orbGradient = ctx.createRadialGradient(
            canvasWidth / 2, centerY, 0,
            canvasWidth / 2, centerY, orbSize
        );
        orbGradient.addColorStop(0, `rgba(255, 255, 255, ${totalEnergy * 0.8})`        );
        // Parse color properly for orb gradient
        let orbColor = getColor(0, 1, totalEnergy);
        if (orbColor.startsWith('rgb(')) {
            orbColor = orbColor.replace('rgb(', 'rgba(').replace(')', ', 0.6)');
        } else if (orbColor.startsWith('hsl(')) {
            orbColor = orbColor.replace('hsl(', 'hsla(').replace(')', ', 0.6)');
        }
        orbGradient.addColorStop(0.7, orbColor);
        orbGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = orbGradient;
        ctx.beginPath();
        ctx.arc(canvasWidth / 2, centerY, orbSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Reset all effects
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}

// Spectral Bars Visualization - Bass Heavy
function drawSpectralBars(ctx, dataArray, canvasWidth, canvasHeight, getColor, time, sensitivity, glow) {
    // Focus on lower 35% of frequency spectrum for more bass emphasis
    const focusLength = Math.floor(dataArray.length * 0.35);
    const focusedData = dataArray.slice(0, focusLength);
    
    const barWidth = canvasWidth / focusedData.length * 2.8;
    
    for (let i = 0; i < focusedData.length; i++) {
        // Enhanced scaling for lower frequencies
        const barHeight = (focusedData[i] / 255) * canvasHeight * 1.1 * sensitivity;
        const intensity = focusedData[i] / 255;
        const x = i * (barWidth + 1);
        
        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(0, canvasHeight, 0, canvasHeight - barHeight);
        const color1 = getColor(i, focusedData.length, intensity);
        const color2 = getColor(i, focusedData.length, intensity * 0.3);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.fillStyle = gradient;
        
        if (glow) {
            ctx.shadowBlur = 18;
            ctx.shadowColor = color1;
        }
        
        // Main bar
        ctx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight);
        
        // Enhanced reflection for bass frequencies
        ctx.globalAlpha = 0.4;
        ctx.fillRect(x, canvasHeight, barWidth, barHeight * 0.6);
        ctx.globalAlpha = 1;
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

// Radial Spectrum Visualization - Low Frequency Focus
function drawRadialSpectrum(ctx, dataArray, canvasWidth, canvasHeight, getColor, time, sensitivity, glow) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const baseRadius = Math.min(centerX, centerY) * 0.3;
    
    // Focus on lower 45% of frequency spectrum
    const focusLength = Math.floor(dataArray.length * 0.45);
    const focusedData = dataArray.slice(0, focusLength);
    
    // Draw multiple concentric circles
    for (let ring = 0; ring < 3; ring++) {
        const radius = baseRadius + ring * 85;
        
        for (let i = 0; i < focusedData.length; i += 1) {
            const angle = (i / focusedData.length) * Math.PI * 2;
            // Enhanced bar height for lower frequencies
            const barHeight = (focusedData[i] / 255) * 120 * sensitivity;
            const intensity = focusedData[i] / 255;
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);
            
            ctx.strokeStyle = getColor(i + ring * 30, focusedData.length, intensity);
            ctx.lineWidth = 7;
            
            if (glow) {
                ctx.shadowBlur = 12;
                ctx.shadowColor = getColor(i + ring * 30, focusedData.length, intensity);
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

// Particle Explosion Visualization - Bass Triggered
function drawParticleExplosion(ctx, dataArray, canvasWidth, canvasHeight, getColor, time, particles, sensitivity) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Focus on lower 30% for bass-heavy particle generation
    const bassLength = Math.floor(dataArray.length * 0.3);
    const bassData = dataArray.slice(0, bassLength);
    const avgVolume = bassData.reduce((a, b) => a + b) / bassData.length;
    
    // Add particles based on low frequency data
    for (let i = 0; i < bassData.length; i += 4) {
        const intensity = bassData[i] / 255;
        // Lower threshold for bass frequencies
        if (intensity > 0.2 && particles.length < 500) {
            const angle = (i / bassData.length) * Math.PI * 2;
            // Enhanced speed for bass response
            const speed = intensity * 18 * sensitivity;
            
            particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.004 + Math.random() * 0.008,
                size: 3 + intensity * 8,
                color: getColor(i, bassData.length, intensity),
                trail: []
            });
        }
    }
    
    // Update and draw particles with trails
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Add to trail
        p.trail.push({ x: p.x, y: p.y, life: p.life });
        if (p.trail.length > 12) p.trail.shift();
        
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.vx *= 0.98;
        p.vy *= 0.98;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        // Draw trail
        for (let j = 0; j < p.trail.length - 1; j++) {
            const alpha = (j / p.trail.length) * p.life * 0.6;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(p.trail[j].x, p.trail[j].y);
            ctx.lineTo(p.trail[j + 1].x, p.trail[j + 1].y);
            ctx.stroke();
        }
        
        // Draw particle
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// Geometric Matrix Visualization - Low Frequency Grid
function drawGeometricMatrix(ctx, dataArray, canvasWidth, canvasHeight, getColor, time, sensitivity, glow) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Focus on lower 40% of frequency spectrum
    const focusLength = Math.floor(dataArray.length * 0.4);
    const focusedData = dataArray.slice(0, focusLength);
    
    // Create a grid of reactive points
    const gridSize = 18;
    const spacing = Math.min(canvasWidth, canvasHeight) / gridSize;
    
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            const px = (x - gridSize/2) * spacing + centerX;
            const py = (y - gridSize/2) * spacing + centerY;
            
            const dataIndex = Math.floor((x + y) * focusedData.length / (gridSize * 2));
            const intensity = focusedData[dataIndex] / 255 * sensitivity * 1.3;
            
            // Lower threshold for bass frequencies
            if (intensity > 0.08) {
                const size = 4 + intensity * 18;
                const color = getColor(dataIndex, focusedData.length, intensity);
                
                ctx.fillStyle = color;
                if (glow) {
                    ctx.shadowBlur = 25;
                    ctx.shadowColor = color;
                }
                
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();
                
                // Connect to nearby active points
                for (let nx = Math.max(0, x-1); nx <= Math.min(gridSize-1, x+1); nx++) {
                    for (let ny = Math.max(0, y-1); ny <= Math.min(gridSize-1, y+1); ny++) {
                        if (nx === x && ny === y) continue;
                        
                        const nDataIndex = Math.floor((nx + ny) * focusedData.length / (gridSize * 2));
                        const nIntensity = focusedData[nDataIndex] / 255 * sensitivity * 1.3;
                        
                        if (nIntensity > 0.08) {
                            const npx = (nx - gridSize/2) * spacing + centerX;
                            const npy = (ny - gridSize/2) * spacing + centerY;
                            
                            ctx.strokeStyle = color;
                            ctx.lineWidth = intensity * 4;
                            ctx.globalAlpha = intensity * 0.6;
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

// Spiral Galaxy Visualization - Bass Driven Arms
function drawSpiralGalaxy(ctx, dataArray, canvasWidth, canvasHeight, getColor, time, sensitivity, glow) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.8;
    
    // Focus on lower 38% of frequency spectrum
    const focusLength = Math.floor(dataArray.length * 0.38);
    const focusedData = dataArray.slice(0, focusLength);
    
    // Draw multiple spiral arms
    for (let arm = 0; arm < 4; arm++) {
        const armOffset = (arm / 4) * Math.PI * 2;
        
        for (let i = 0; i < focusedData.length; i += 2) {
            const intensity = focusedData[i] / 255 * sensitivity * 1.4;
            if (intensity < 0.08) continue;
            
            const radius = (i / focusedData.length) * maxRadius;
            const angle = armOffset + (radius / maxRadius) * Math.PI * 5 + time * 0.4;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            const size = 3 + intensity * 10;
            const color = getColor(i + arm * 40, focusedData.length, intensity);
            
            ctx.fillStyle = color;
            if (glow) {
                ctx.shadowBlur = 18;
                ctx.shadowColor = color;
            }
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add trailing effect
            if (i > 1) {
                const prevRadius = ((i - 2) / focusedData.length) * maxRadius;
                const prevAngle = armOffset + (prevRadius / maxRadius) * Math.PI * 5 + time * 0.4;
                const prevX = centerX + Math.cos(prevAngle) * prevRadius;
                const prevY = centerY + Math.sin(prevAngle) * prevRadius;
                
                ctx.strokeStyle = color;
                ctx.lineWidth = intensity * 2.5;
                ctx.globalAlpha = intensity * 0.7;
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

// Warp Tunnel Visualization - Bass Response Tunnel
function drawWarpTunnel(ctx, dataArray, canvasWidth, canvasHeight, getColor, time, sensitivity, glow) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const maxRadius = Math.min(centerX, centerY);
    
    // Focus on lower 42% of frequency spectrum
    const focusLength = Math.floor(dataArray.length * 0.42);
    const focusedData = dataArray.slice(0, focusLength);
    
    // Draw tunnel rings moving towards viewer
    for (let ring = 0; ring < 15; ring++) {
        const ringTime = time * 4 + ring * 0.6;
        const z = (ringTime % 12) / 12; // 0 to 1, cycling
        const radius = maxRadius * (1 - z) * 0.85;
        
        if (radius < 8) continue;
        
        const segments = 24;
        const dataStep = Math.floor(focusedData.length / segments);
        
        ctx.beginPath();
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const dataIndex = i * dataStep;
            const intensity = focusedData[dataIndex] / 255 * sensitivity * 1.3;
            
            const waveRadius = radius + intensity * 60 * (1 - z);
            const x = centerX + Math.cos(angle) * waveRadius;
            const y = centerY + Math.sin(angle) * waveRadius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        
        const avgIntensity = focusedData.reduce((a, b) => a + b) / focusedData.length / 255;
        const color = getColor(ring * 12, 180, avgIntensity * (1 - z));
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5 * (1 - z);
        ctx.globalAlpha = (1 - z) * 0.9;
        
        if (glow) {
            ctx.shadowBlur = 25 * (1 - z);
            ctx.shadowColor = color;
        }
        
        ctx.stroke();
        
        // Add inner glow lines for bass response
        if (z < 0.75) {
            for (let i = 0; i < segments; i += 3) {
                const angle = (i / segments) * Math.PI * 2;
                const dataIndex = i * dataStep;
                const intensity = focusedData[dataIndex] / 255 * sensitivity * 1.3;
                
                // Lower threshold for bass frequencies
                if (intensity > 0.25) {
                    const innerRadius = radius * 0.6;
                    const outerRadius = radius + intensity * 40;
                    
                    const x1 = centerX + Math.cos(angle) * innerRadius;
                    const y1 = centerY + Math.sin(angle) * innerRadius;
                    const x2 = centerX + Math.cos(angle) * outerRadius;
                    const y2 = centerY + Math.sin(angle) * outerRadius;
                    
                    ctx.strokeStyle = getColor(dataIndex, focusedData.length, intensity);
                    ctx.lineWidth = 2.5;
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