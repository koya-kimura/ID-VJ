import p5 from 'p5';
import type { IScene } from './IScene';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';

interface BounceState {
    position: number;
    velocity: number;
    squashEnergy: number;
    isFalling: boolean;
}

type BounceStyle = "classic" | "elastic" | "stutter" | "cascade";
type ShadingMode = "flat" | "highlight" | "glow" | "spark";
type SwingMode = "none" | "sine" | "zig" | "random";
type TrailMode = "none" | "line" | "shadow" | "sparkle";

export class Scene5 implements IScene {
    public name: string = 'Scene 5: Falling Bounce Array';

    private readonly laneCountOptions = [5, 7, 9, 11];
    private readonly sizeOptions = [0.09, 0.12, 0.16, 0.2];
    private readonly fallDurationOptions = [0.52, 0.68, 0.82, 0.95];
    private readonly tiltOptions = [0.04, 0.075, 0.11, 0.16];
    private readonly bounceStyles: BounceStyle[] = ["classic", "elastic", "stutter", "cascade"];
    private readonly shadingModes: ShadingMode[] = ["flat", "highlight", "glow", "spark"];
    private readonly swingModes: SwingMode[] = ["none", "sine", "zig", "random"];
    private readonly trailModes: TrailMode[] = ["none", "line", "shadow", "sparkle"];

    private readonly maxOptions: number[] = [
        this.laneCountOptions.length,
        this.sizeOptions.length,
        this.fallDurationOptions.length,
    this.tiltOptions.length,
        this.bounceStyles.length,
        this.shadingModes.length,
        this.swingModes.length,
        this.trailModes.length,
    ];

    public setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void {
        apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
    }

    public draw(_p: p5, tex: p5.Graphics, _tex3d: p5.Graphics, apcManager: APCMiniMK2Manager, currentBeat: number): void {
        const selection = new Array(8).fill(0).map((_, i) => apcManager.getParamValue(i));

        const laneCount = this.laneCountOptions[selection[0]];
        const sizeScale = this.sizeOptions[selection[1]];
        const fallDuration = this.fallDurationOptions[selection[2]];
    const tiltAmount = this.tiltOptions[selection[3]];
        const bounceStyle = this.bounceStyles[selection[4]];
        const shadingMode = this.shadingModes[selection[5]];
        const swingMode = this.swingModes[selection[6]];
        const trailMode = this.trailModes[selection[7]];

        tex.background(0);

        const width = tex.width;
        const height = tex.height;
        const minDim = Math.min(width, height);
        const startY = -minDim * 0.55;
        const floorY = minDim * 0.42;
        const laneSpacing = minDim * 0.18 * (7 / Math.max(1, laneCount - 1));
        const laneOffsets = this.computeLaneOffsets(laneCount, bounceStyle);

        tex.push();
    tex.translate(width / 2, height / 2 - minDim * 0.1);
    tex.rotate(Math.sin(currentBeat * 0.3) * tiltAmount);
    tex.shearX(Math.cos(currentBeat * 0.27) * tiltAmount * 0.6);
    tex.scale(1 + Math.sin(currentBeat * 0.18) * tiltAmount * 0.25, 1 + Math.cos(currentBeat * 0.22) * tiltAmount * 0.2);
        tex.noStroke();

    const slowBeat = currentBeat * 0.5;

        for (let lane = 0; lane < laneCount; lane++) {
            const offset = laneOffsets[lane];
            const phase = this.mod1(slowBeat + offset);
            const bouncePhase = bounceStyle === "cascade" ? this.mod1(phase + lane * 0.07) : phase;
            const bounce = this.computeBounce(bouncePhase, fallDuration, bounceStyle);
            const dragFactor = 1 - Math.exp(-3.2 * bouncePhase);
            const fade = this.computeFade(bouncePhase, bounceStyle);

            const laneCenter = (lane - (laneCount - 1) / 2) * laneSpacing;
            const swing = this.computeSwing(swingMode, slowBeat, lane, minDim, dragFactor, bounce.velocity);
            const x = laneCenter + swing.x;
            const y = startY + (floorY - startY) * bounce.position + swing.y;

            const perspective = this.depthPerspective(lane, laneCount, slowBeat);
            const baseSize = minDim * sizeScale * perspective.scale;
            const bounceScale = this.computeCircleScale(bounce, bounceStyle);
            const circleSize = Math.max(minDim * 0.02, baseSize * bounceScale);

            const adjustedY = y + perspective.offset * minDim;

            this.drawTrail(tex, trailMode, laneCenter + swing.trailX, floorY, adjustedY, circleSize, minDim, bouncePhase, fade);

            const color = this.resolveFill(shadingMode, bounce, fade, lane, laneCount);
            tex.fill(color.fill, color.alpha);
            tex.ellipse(x, adjustedY, circleSize, circleSize);

            if (color.highlightAlpha > 0.01) {
                tex.fill(255, color.highlightAlpha * fade);
                const highlightSize = circleSize * 0.32;
                tex.ellipse(x - circleSize * 0.22, adjustedY - circleSize * 0.24, highlightSize, highlightSize);
            }
        }

        tex.pop();
    }

    private computeLaneOffsets(laneCount: number, style: BounceStyle): number[] {
        const offsets: number[] = [];
        for (let i = 0; i < laneCount; i++) {
            const ratio = laneCount === 1 ? 0 : i / (laneCount - 1);
            switch (style) {
                case "elastic":
                    offsets.push(ratio * 0.78 + Math.sin(i * 0.45) * 0.04);
                    break;
                case "stutter":
                    offsets.push(Math.round(ratio * 6) / 6 + (i % 2 === 0 ? 0 : 0.08));
                    break;
                case "cascade":
                    offsets.push(ratio * 0.95);
                    break;
                case "classic":
                default:
                    offsets.push(ratio * 0.85);
                    break;
            }
        }
        return offsets;
    }

    private computeBounce(phase: number, fallDuration: number, style: BounceStyle): BounceState {
        const accel = style === "elastic" ? 1.32 : 1.45;
        if (phase < fallDuration) {
            const t = phase / fallDuration;
            const exponent = accel;
            const position = Math.pow(t, exponent);
            const velocity = (exponent * Math.pow(t, exponent - 1)) / fallDuration;
            const energy = Math.min(1, velocity * (style === "stutter" ? 0.7 : 0.9));
            return {
                position,
                velocity,
                squashEnergy: energy,
                isFalling: true,
            };
        }

        const remaining = Math.max(0.01, 1 - fallDuration);
        const bouncePhase = (phase - fallDuration) / remaining;
        const dampingBase = style === "elastic" ? 2.3 : 3.1;
        const damping = Math.exp(-dampingBase * bouncePhase);
        const sinTerm = Math.sin(Math.PI * bouncePhase);
        const cosine = Math.cos(Math.PI * bouncePhase);
        const amplitude = style === "elastic" ? 0.42 : 0.34;

        let displacement = amplitude * damping * sinTerm;
        if (style === "stutter") {
            const quant = Math.round(bouncePhase * 6) / 6;
            displacement = amplitude * Math.exp(-2.6 * quant) * Math.sin(Math.PI * quant);
        }

        const position = 1 - displacement;
        const velocity = (amplitude * damping * (Math.PI * cosine - dampingBase * sinTerm)) / remaining;
        const squashEnergy = Math.min(1, displacement * (style === "elastic" ? 3.6 : 3.1) + Math.abs(velocity) * 0.4);

        return {
            position,
            velocity,
            squashEnergy,
            isFalling: false,
        };
    }

    private computeStretch(bounce: BounceState, style: BounceStyle): { width: number; height: number } {
        const speed = Math.min(1, Math.abs(bounce.velocity) * 0.9);
        if (bounce.isFalling) {
            const fallTall = style === "elastic" ? 0.75 : 0.6;
            return {
                width: Math.max(0.55, 1 - 0.35 * speed),
                height: 1 + fallTall * speed,
            };
        }

        const squash = Math.min(1, bounce.squashEnergy * (style === "stutter" ? 0.9 : 1.1));
        return {
            width: 1 + 0.65 * squash,
            height: Math.max(0.28, 1 - 0.62 * squash),
        };
    }

    private computeSwing(mode: SwingMode, slowBeat: number, lane: number, minDim: number, dragFactor: number, velocity: number): { x: number; y: number; trailX: number } {
        switch (mode) {
            case "sine":
                return {
                    x: Math.sin(slowBeat * 0.24 + lane * 0.8) * minDim * 0.012 * (0.3 + 0.7 * dragFactor) + velocity * minDim * 0.006,
                    y: Math.sin(slowBeat * 0.5 + lane * 0.4) * minDim * 0.01,
                    trailX: 0,
                };
            case "zig":
                return {
                    x: (Math.sign(Math.sin(slowBeat * 0.5 + lane)) * minDim * 0.02) * (0.2 + dragFactor * 0.8),
                    y: Math.cos(slowBeat * 0.6 + lane * 0.3) * minDim * 0.006,
                    trailX: 0,
                };
            case "random": {
                const jitter = (Math.sin(slowBeat * 1.3 + lane * 2.1) + Math.sin(slowBeat * 0.7 + lane * 1.7)) * 0.5;
                return {
                    x: jitter * minDim * 0.015 + velocity * minDim * 0.004,
                    y: Math.sin(slowBeat * 0.9 + lane) * minDim * 0.008,
                    trailX: jitter * minDim * 0.005,
                };
            }
            case "none":
            default:
                return {
                    x: velocity * minDim * 0.006,
                    y: 0,
                    trailX: 0,
                };
        }
    }

    private drawTrail(tex: p5.Graphics, mode: TrailMode, x: number, floorY: number, y: number, circleSize: number, minDim: number, phase: number, fade: number): void {
        switch (mode) {
            case "line":
                for (let i = 0; i < 3; i++) {
                    const t = i / 3;
                    const alpha = 28 * fade * (1 - t);
                    tex.fill(255, alpha);
                    tex.ellipse(x, y + (floorY - y) * t, circleSize * (0.55 + t * 0.3), circleSize * (0.55 + t * 0.3));
                }
                break;
            case "shadow":
                tex.fill(255, 40 * fade);
                const span = Math.min(1, Math.pow(phase, 1.2));
                const shadowSize = circleSize * (1.3 + span * 1.1);
                tex.ellipse(x, floorY + minDim * 0.02, shadowSize, shadowSize * 0.9);
                break;
            case "sparkle":
                if (phase > 0.6) {
                    tex.fill(255, 120 * fade * (phase - 0.6) * 2.5);
                    const sparkleSize = circleSize * 0.28;
                    tex.ellipse(x, y - minDim * 0.1 * (phase - 0.6), sparkleSize, sparkleSize);
                }
                break;
            case "none":
            default:
                break;
        }
    }

    private resolveFill(mode: ShadingMode, bounce: BounceState, fade: number, lane: number, laneCount: number): { fill: number; alpha: number; highlightAlpha: number } {
        const brightness = 200 + 55 * Math.max(0, 1 - bounce.position);
        switch (mode) {
            case "highlight":
                return {
                    fill: 255,
                    alpha: brightness * fade,
                    highlightAlpha: 200,
                };
            case "glow":
                return {
                    fill: 255,
                    alpha: (180 + 60 * Math.sin((lane / Math.max(1, laneCount - 1)) * Math.PI)) * fade,
                    highlightAlpha: 160,
                };
            case "spark":
                return {
                    fill: 255,
                    alpha: (140 + 120 * Math.abs(Math.sin(lane * 0.85 + bounce.velocity * 3))) * fade,
                    highlightAlpha: 220 * Math.min(1, bounce.squashEnergy * 1.4),
                };
            case "flat":
            default:
                return {
                    fill: 255,
                    alpha: brightness * fade,
                    highlightAlpha: 0,
                };
        }
    }

    private computeFade(phase: number, style: BounceStyle): number {
        let fadeStart = 0.82;
        if (style === "elastic") {
            fadeStart = 0.86;
        } else if (style === "cascade") {
            fadeStart = 0.9;
        }
        const progress = Math.max(0, (phase - fadeStart) / (1 - fadeStart));
        return phase < fadeStart ? 1 : Math.pow(1 - progress, 1.4);
    }

    private mod1(value: number): number {
        return ((value % 1) + 1) % 1;
    }

    private computeCircleScale(bounce: BounceState, style: BounceStyle): number {
        const speed = Math.min(1, Math.abs(bounce.velocity) * (style === "elastic" ? 1.15 : 0.9));
        const squash = Math.min(1, bounce.squashEnergy * (style === "stutter" ? 0.85 : 1));

        if (bounce.isFalling) {
            return 0.85 + speed * 0.4;
        }

        return 1.0 + squash * 0.45;
    }

    private depthPerspective(lane: number, laneCount: number, beat: number): { scale: number; offset: number } {
        if (laneCount <= 1) {
            return { scale: 1, offset: 0 };
        }

        const center = (laneCount - 1) / 2;
        const normalized = (lane - center) / center;
        const depthPulse = Math.sin(beat * 0.35 + normalized * 1.2);
        const scale = 0.85 + (1 - Math.abs(normalized)) * 0.35 + depthPulse * 0.08;
        const offset = normalized * 0.06 - depthPulse * 0.03;

        return { scale, offset };
    }
}