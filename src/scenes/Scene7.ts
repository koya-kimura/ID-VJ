// src/scenes/Scene7.ts

import p5 from 'p5';
import type { IScene } from "./IScene";
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { Easing } from '../utils/easing';

type EaseFn = (t: number) => number;

/**
 * Scene7: Binary Particle Loom (移設)
 * 旧Scene8の粒子表現をベースに、全てのパラメータを選択肢ドリブンに再構成。
 */
export class Scene7 implements IScene {
    public name: string = "Scene 7: Binary Particle Loom";

    private readonly gridOptions = [6, 10, 14, 18];
    private readonly sizeOptions = [0.75, 1.0, 1.35, 1.8];
    private readonly travelOptions = [0.6, 0.85, 1.1, 1.45];
    private readonly speedOptions = [0.1, 0.2, 0.4, 0.7];
    private readonly layoutModes = [
        "grid",
        "rings",
        "spiral",
        "bands",
        "scatter",
    ] as const;
    private readonly motionModes = [
        "breath",
        "swirl",
        "lattice",
        "noise",
        "pulse",
    ] as const;
    private readonly layerPackages = [
        { layers: 1, trailAlpha: 16 },
        { layers: 2, trailAlpha: 40 },
        { layers: 4, trailAlpha: 80 },
        { layers: 6, trailAlpha: 130 },
    ];
    private readonly pulseProfiles: EaseFn[] = [
        Easing.easeInOutSine,
        Easing.easeInOutCubic,
        Easing.easeOutBack,
        (t) => 1 - Easing.easeInCirc(Math.abs(0.5 - t) * 2),
    ];

    private maxOptions: number[] = [
        this.gridOptions.length,
        this.sizeOptions.length,
        this.travelOptions.length,
        this.speedOptions.length,
        this.layoutModes.length,
        this.motionModes.length,
        this.layerPackages.length,
        this.pulseProfiles.length,
    ];

    public setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void {
        apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
    }

    public draw(p: p5, tex: p5.Graphics, _tex3d: p5.Graphics, apcManager: APCMiniMK2Manager, currentBeat: number): void {
        const selection = new Array(8).fill(0).map((_, i) => apcManager.getParamValue(i));

        const gridRes = this.gridOptions[selection[0]];
        const sizeMul = this.sizeOptions[selection[1]];
        const travel = this.travelOptions[selection[2]];
        const speed = this.speedOptions[selection[3]];
        const layout = this.layoutModes[selection[4]];
        const motion = this.motionModes[selection[5]];
        const layerPackage = this.layerPackages[selection[6]];
        const pulse = this.pulseProfiles[selection[7]];

        const layerCount = layerPackage.layers;
        const trailAlpha = layerPackage.trailAlpha;

        tex.noStroke();
        tex.fill(0, trailAlpha);
        tex.rect(0, 0, tex.width, tex.height);

        tex.push();
        tex.translate(tex.width / 2, tex.height / 2);

        const minDim = Math.min(tex.width, tex.height);
        const step = (minDim / (gridRes + 2)) * (0.85 + 0.15 * Math.min(1, travel));
        const time = currentBeat * speed;
        const beatPhase = this.mod1(currentBeat);
        const pulseValue = 0.3 + 0.7 * pulse(beatPhase);

        let particleIndex = 0;
        for (let layer = 0; layer < layerCount; layer++) {
            const layerRatio = layerCount > 1 ? layer / (layerCount - 1) : 0;
            const layerPhase = layerRatio * Math.PI * 2;
            const sizeBase = step * sizeMul * (0.9 + 0.3 * layerRatio) * 0.5;

            for (let y = 0; y < gridRes; y++) {
                for (let x = 0; x < gridRes; x++) {
                    const u = (x + 0.5) / gridRes - 0.5;
                    const v = (y + 0.5) / gridRes - 0.5;

                    const layoutPos = this.layoutPosition(layout, u, v, minDim, layerRatio, time, travel);
                    const motionOffset = this.motionOffset(p, motion, u, v, time, layerPhase, particleIndex, step, travel);
                    const organic = this.organicOffset(u, v, layerRatio, time, particleIndex, step, layout, travel);

                    const px = layoutPos.x + motionOffset.x + organic.x;
                    const py = layoutPos.y + motionOffset.y + organic.y;

                    const dist = Math.sqrt(u * u + v * v);
                    const microBeat = this.mod1(time * 0.45 + particleIndex * 0.003 + layerRatio * 0.07);
                    const alpha = this.particleAlpha(layout, particleIndex, time, pulseValue, dist, travel, layerRatio) * (0.75 + 0.25 * this.bounce(microBeat));
                    const sizeEnvelope = this.sizeEnvelope(pulseValue, travel, this.mod1(beatPhase + layerRatio * 0.12), layerRatio);
                    const size = sizeBase * sizeEnvelope * this.sizeMod(layout, dist, layerRatio, travel) * (0.8 + 0.2 * this.bounce(this.mod1(microBeat + 0.35)));

                    tex.fill(255, alpha);
                    tex.ellipse(px, py, size, size);

                    particleIndex++;
                }
            }
        }

        tex.pop();
    }

    private layoutPosition(
        mode: typeof this.layoutModes[number],
        u: number,
        v: number,
        minDim: number,
        layerRatio: number,
        time: number,
        travel: number,
    ): { x: number; y: number } {
        const baseX = u * minDim * (0.9 + 0.1 * travel);
        const baseY = v * minDim * (0.9 + 0.1 * travel);
        const angle = Math.atan2(v, u);
        const dist = Math.sqrt(u * u + v * v);

        switch (mode) {
            case "rings":
                return {
                    x: Math.cos(angle) * dist * minDim * (0.65 + 0.3 * layerRatio * travel),
                    y: Math.sin(angle) * dist * minDim * (0.65 + 0.3 * layerRatio * travel),
                };
            case "spiral":
                return {
                    x: Math.cos(angle + layerRatio * Math.PI * 2 * travel) * dist * minDim,
                    y: Math.sin(angle + layerRatio * Math.PI * 2 * travel) * dist * minDim,
                };
            case "bands":
                return {
                    x: baseX * (0.45 + 0.55 * Math.sign(Math.sin(time + u * Math.PI * 8)) * travel),
                    y: baseY * (0.45 + 0.55 * Math.sign(Math.cos(time * 0.8 + v * Math.PI * 8)) * travel),
                };
            case "scatter":
                return {
                    x: baseX + Math.sin(u * 50 + layerRatio * 13) * minDim * 0.05 * travel,
                    y: baseY + Math.sin(v * 50 + layerRatio * 19) * minDim * 0.05 * travel,
                };
            default:
                return { x: baseX, y: baseY };
        }
    }

    private motionOffset(
        p: p5,
        mode: typeof this.motionModes[number],
        u: number,
        v: number,
        time: number,
        layerPhase: number,
        index: number,
        step: number,
        travel: number,
    ): { x: number; y: number } {
        const amplitude = step * travel;
        switch (mode) {
            case "breath":
                const breath = Math.sin(time * 0.6 + layerPhase) * 0.3;
                return { x: u * amplitude * 6 * breath, y: v * amplitude * 6 * breath };
            case "swirl":
                return {
                    x: -v * amplitude * 6 * Math.sin(time + layerPhase),
                    y: u * amplitude * 6 * Math.sin(time + layerPhase),
                };
            case "lattice":
                return {
                    x: Math.sin(time + u * Math.PI * 4 + layerPhase) * amplitude * 2.6,
                    y: Math.sin(time * 1.3 + v * Math.PI * 4 - layerPhase) * amplitude * 2.6,
                };
            case "noise":
                return {
                    x: (p.noise(index * 17, time * 0.15) - 0.5) * amplitude * 3.2,
                    y: (p.noise(index * 41, time * 0.15) - 0.5) * amplitude * 3.2,
                };
            default: // pulse
                const pulseMag = Math.sin(time * 0.7 + index * 0.02 + layerPhase);
                return { x: pulseMag * amplitude * 3.4, y: pulseMag * amplitude * 1.8 };
        }
    }

    private particleAlpha(
        layout: typeof this.layoutModes[number],
        index: number,
        time: number,
        pulseValue: number,
        dist: number,
        travel: number,
        layerRatio: number,
    ): number {
        const base = layout === "bands" ? 170 : 210;
        const modulation = 0.45 + 0.55 * Math.abs(Math.sin(time + index * 0.015 * travel));
        const radial = layout === "rings" ? (0.45 + 0.55 * (1 - dist)) : 1;
        const layerFade = 0.6 + 0.4 * (1 - layerRatio * 0.6);
        return Math.min(255, base * modulation * pulseValue * radial * layerFade);
    }

    private sizeEnvelope(pulseValue: number, travel: number, beatPhase: number, layerRatio: number): number {
        const beatPulse = 0.65 + 0.35 * pulseValue;
        const travelPulse = 0.75 + 0.25 * Math.sin(beatPhase * Math.PI * 2 + layerRatio * Math.PI) * travel * 0.5;
        return beatPulse * (0.9 + 0.3 * travelPulse);
    }

    private sizeMod(layout: typeof this.layoutModes[number], dist: number, layerRatio: number, travel: number): number {
        switch (layout) {
            case "rings":
                return 0.55 + 0.85 * (1 - dist) * (0.6 + 0.4 * travel);
            case "spiral":
                return 0.7 + 0.6 * layerRatio * (0.8 + 0.2 * travel);
            case "bands":
                return 0.7 + 0.5 * Math.abs(Math.sin(dist * Math.PI * 4)) * (0.8 + 0.2 * travel);
            case "scatter":
                return 0.9 + 0.3 * layerRatio * (0.7 + 0.3 * travel);
            default:
                return 1.0;
        }
    }

    private organicOffset(
        u: number,
        v: number,
        layerRatio: number,
        time: number,
        index: number,
        step: number,
        layout: typeof this.layoutModes[number],
        travel: number,
    ): { x: number; y: number } {
        const beat = this.mod1(time * 0.25 + index * 0.002 + layerRatio * 0.13);
        const lateral = (this.bounce(beat) - 0.5) * step * 1.6 * travel;
        const vertical = (this.dualEase(beat) - 0.5) * step * 1.3 * travel;

        switch (layout) {
            case "rings":
                return {
                    x: lateral * (0.6 + layerRatio * 0.7) * Math.cos(time + index * 0.01),
                    y: vertical * (0.6 + layerRatio * 0.4) * Math.sin(time * 0.8 + index * 0.015),
                };
            case "spiral":
                return {
                    x: lateral * Math.cos(time + layerRatio * Math.PI),
                    y: vertical * Math.sin(time * 1.1 + layerRatio * Math.PI),
                };
            case "bands":
                return {
                    x: lateral * Math.sin(v * Math.PI * 6 + time),
                    y: vertical * Math.cos(u * Math.PI * 6 - time * 0.8),
                };
            case "scatter":
                return {
                    x: lateral * (Math.sin(index * 0.17) + 0.5),
                    y: vertical * (Math.cos(index * 0.23) + 0.5),
                };
            default:
                return { x: lateral, y: vertical };
        }
    }

    private bounce(t: number): number {
        const phase = ((t % 1) + 1) % 1;
        const folded = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
        return Easing.easeOutQuad(folded);
    }

    private dualEase(t: number): number {
        if (t < 0.5) {
            return 0.5 * Easing.easeInQuad(t * 2);
        }
        return 0.5 + 0.5 * Easing.easeOutBack((t - 0.5) * 2);
    }

    private mod1(value: number): number {
        return ((value % 1) + 1) % 1;
    }
}