// src/scenes/RadialPulseConduitsScene.ts

import p5 from 'p5';
import type { IScene } from '../core/IScene';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { Easing } from '../utils/easing';

type EaseFn = (t: number) => number;

type AccentMode = 'solid' | 'stutter' | 'burst' | 'skip-two' | 'mirror';
type JitterMode = 'none' | 'beat' | 'noise' | 'spiral';

type MotionInputs = {
    ringCount: number;
    baseSegments: number;
    accentMode: AccentMode;
    spinSpeed: number;
    easeFn: EaseFn;
    trailAlpha: number;
    jitterMode: JitterMode;
    strokePalette: { base: number; accent: number; spokes: boolean };
};

/**
 * RadialPulseConduitsScene
 * ------------------------
 * 複数リングで構成された放射状のアークを描画し、拍に合わせて膨張・収縮するシーン。
 */
export class RadialPulseConduitsScene implements IScene {
    public name: string = 'Radial Pulse Conduits';

    private readonly ringCountOptions = [3, 5, 8, 12];
    private readonly segmentOptions = [8, 12, 18, 24];
    private readonly accentModes: AccentMode[] = ['solid', 'stutter', 'burst', 'skip-two', 'mirror'];
    private readonly spinSpeedOptions = [0.15, 0.28, 0.45, 0.7];
    private readonly easeProfiles: EaseFn[] = [
        Easing.easeInOutSine,
        Easing.easeInOutCubic,
        Easing.easeInOutCirc,
        (t) => Easing.easeOutBack(t),
    ];
    private readonly trailAlphaOptions = [16, 40, 80, 140];
    private readonly jitterModes: JitterMode[] = ['none', 'beat', 'noise', 'spiral'];
    private readonly strokePalettes = [
        { base: 1.4, accent: 1.2, spokes: false },
        { base: 1.0, accent: 2.4, spokes: true },
        { base: 0.8, accent: 3.4, spokes: false },
        { base: 2.2, accent: 1.6, spokes: true },
    ];

    private readonly maxOptions: number[] = [
        this.ringCountOptions.length,
        this.segmentOptions.length,
        this.accentModes.length,
        this.spinSpeedOptions.length,
        this.easeProfiles.length,
        this.trailAlphaOptions.length,
        this.jitterModes.length,
        this.strokePalettes.length,
    ];

    public setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void {
        apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
    }

    public draw(p: p5, tex: p5.Graphics, _tex3d: p5.Graphics, apcManager: APCMiniMK2Manager, currentBeat: number): void {
        const selection = new Array(8).fill(0).map((_, i) => apcManager.getParamValue(i));

        const inputs: MotionInputs = {
            ringCount: this.ringCountOptions[selection[0]],
            baseSegments: this.segmentOptions[selection[1]],
            accentMode: this.accentModes[selection[2]],
            spinSpeed: this.spinSpeedOptions[selection[3]],
            easeFn: this.easeProfiles[selection[4]],
            trailAlpha: this.trailAlphaOptions[selection[5]],
            jitterMode: this.jitterModes[selection[6]],
            strokePalette: this.strokePalettes[selection[7]],
        };

        this.drawScene(p, tex, inputs, currentBeat);
    }

    private drawScene(p: p5, tex: p5.Graphics, inputs: MotionInputs, currentBeat: number): void {
        const { ringCount, baseSegments, accentMode, spinSpeed, easeFn, trailAlpha, jitterMode, strokePalette } = inputs;

        tex.noStroke();
        tex.fill(0, trailAlpha);
        tex.rect(0, 0, tex.width, tex.height);

        tex.push();
        tex.translate(tex.width / 2, tex.height / 2);
        tex.noFill();
        tex.stroke(255);
        tex.strokeCap(p.ROUND);
        tex.strokeJoin(p.ROUND);

        const minDim = Math.min(tex.width, tex.height);
        const baseRadius = minDim * 0.42;

        const scatterPhase = ((currentBeat / 12) % 1 + 1) % 1;
        const scatterWeight = Easing.easeInOutCubic(scatterPhase);
        const scatterFactor = p.lerp(0.55, 1.6, scatterWeight);

        const beatPhase = (currentBeat % 1 + 1) % 1;
        const easedBeat = easeFn(beatPhase);
        const longCycle = (currentBeat % 16) / 16;
        const slowPulse = easeFn(longCycle);

        const globalSpin = currentBeat * spinSpeed * p.TAU;

        for (let ring = 0; ring < ringCount; ring++) {
            const ringRatio = (ring + 1) / (ringCount + 1);
            const growth = 0.35 + ringRatio * (0.65 + 0.25 * slowPulse);
            const radius = baseRadius * growth * scatterFactor * (1 + this.jitterOffset(jitterMode, ring, currentBeat));
            const segmentCount = Math.max(3, baseSegments + this.segmentOffset(accentMode, ring));
            const baseSpan = p.TAU / segmentCount;
            const spanMultiplier = 0.55 + 0.4 * easedBeat;
            const angleOffset = globalSpin + ring * 0.25 + this.jitterAngle(jitterMode, ring, currentBeat);

            const strokeWeight = strokePalette.base * (1 + strokePalette.accent * easedBeat);
            tex.strokeWeight(strokeWeight);

            const sway = this.axisSway(p, ring, currentBeat, ringRatio);
            tex.push();
            tex.translate(sway.x, sway.y);
            tex.rotate(sway.rotation);

            for (let seg = 0; seg < segmentCount; seg++) {
                if (this.shouldSkipSegment(accentMode, seg, ring, beatPhase)) {
                    continue;
                }

                const startAngle = angleOffset + seg * baseSpan;
                const endAngle = startAngle + baseSpan * spanMultiplier * this.segmentSpanMultiplier(accentMode, seg, easedBeat);

                tex.arc(0, 0, radius * 2, radius * 2, startAngle, endAngle);

                if (strokePalette.spokes && seg % 2 === 0) {
                    const spokeStrength = 0.25 + 0.6 * easedBeat;
                    const innerRadius = radius * (0.3 + 0.6 * ringRatio * spokeStrength);
                    tex.line(
                        innerRadius * Math.cos(startAngle),
                        innerRadius * Math.sin(startAngle),
                        radius * Math.cos((startAngle + endAngle) / 2),
                        radius * Math.sin((startAngle + endAngle) / 2),
                    );
                }
            }

            this.drawPulseMarker(tex, radius, angleOffset, spanMultiplier, easedBeat, ringRatio, accentMode, strokePalette.spokes, beatPhase);

            tex.pop();
        }

        tex.pop();
    }

    private axisSway(p: p5, ring: number, beat: number, ratio: number): { x: number; y: number; rotation: number } {
        const horizontalPhase = ((beat * 0.3 + ring * 0.17) % 1 + 1) % 1;
        const verticalPhase = ((beat * 0.45 + ring * 0.11) % 1 + 1) % 1;
        const horizontal = (Easing.easeInOutSine(horizontalPhase) - 0.5) * 0.22 * ratio;
        const vertical = (Easing.easeOutBack(Math.min(1, verticalPhase * 1.1)) - 0.5) * 0.28 * (1 - ratio * 0.4);
        const rotation = (Easing.easeInOutCubic(horizontalPhase) - 0.5) * 0.35 * (ring % 2 === 0 ? 1 : -1);
        const minDim = Math.min(p.width, p.height);
        return {
            x: horizontal * minDim,
            y: vertical * minDim,
            rotation,
        };
    }

    private drawPulseMarker(
        tex: p5.Graphics,
        radius: number,
        angleOffset: number,
        spanMultiplier: number,
        easedBeat: number,
        ringRatio: number,
        accentMode: AccentMode,
        hasSpokes: boolean,
        beatPhase: number,
    ): void {
        const headAngle = angleOffset + spanMultiplier * Math.PI * (0.4 + easedBeat * 0.6);
        const headPos = {
            x: Math.cos(headAngle) * radius,
            y: Math.sin(headAngle) * radius,
        };

        tex.noStroke();
        const baseAlpha = 120 + 100 * (1 - ringRatio);
        tex.fill(255, baseAlpha);
        const size = radius * 0.06 * (1 + easedBeat * 0.8);
        tex.ellipse(headPos.x, headPos.y, size, size * 0.9);

        if (accentMode === 'burst' || hasSpokes) {
            tex.noFill();
            tex.stroke(255, 60);
            tex.strokeWeight(size * 0.25);
            const ringSize = radius * (0.12 + 0.18 * easedBeat);
            tex.ellipse(headPos.x, headPos.y, ringSize, ringSize * 0.9);
        }

        tex.noFill();
        tex.stroke(255, 36);
        tex.strokeWeight(size * 0.18);
        tex.arc(0, 0, radius * 2.1, radius * 2.1, headAngle - 0.2, headAngle + 0.2 + beatPhase * 0.3);
        tex.noStroke();
    }

    private segmentOffset(mode: AccentMode, ring: number): number {
        switch (mode) {
            case 'burst':
                return ring % 2 === 0 ? 6 : 2;
            case 'stutter':
                return (ring % 3) - 1;
            case 'mirror':
                return ring < 2 ? 4 : 0;
            case 'skip-two':
                return 0;
            case 'solid':
            default:
                return 0;
        }
    }

    private segmentSpanMultiplier(mode: AccentMode, seg: number, easedBeat: number): number {
        switch (mode) {
            case 'burst':
                return 1.2 + 0.6 * easedBeat;
            case 'stutter':
                return seg % 2 === 0 ? 0.45 : 0.9 + 0.4 * easedBeat;
            case 'skip-two':
                return seg % 3 === 0 ? 1.3 : 0.6;
            case 'mirror':
                return seg % 2 === 0 ? 1.0 + 0.5 * easedBeat : 0.7;
            case 'solid':
            default:
                return 1.0;
        }
    }

    private shouldSkipSegment(mode: AccentMode, seg: number, ring: number, beatPhase: number): boolean {
        switch (mode) {
            case 'skip-two':
                return (seg + ring) % 3 === 0;
            case 'stutter':
                return (seg + Math.floor(beatPhase * 8)) % 4 === 0;
            default:
                return false;
        }
    }

    private jitterOffset(mode: JitterMode, ring: number, beat: number): number {
        switch (mode) {
            case 'beat':
                return 0.15 * Math.sin((beat + ring * 0.25) * Math.PI);
            case 'noise':
                return 0.08 * Math.sin((ring + 1) * 1.3 + beat * 0.7);
            case 'spiral':
                return 0.14 * Math.sin(beat * 0.6 + ring * 0.8);
            case 'none':
            default:
                return 0;
        }
    }

    private jitterAngle(mode: JitterMode, ring: number, beat: number): number {
        switch (mode) {
            case 'noise':
                return 0.35 * Math.sin(beat * 0.9 + ring * 0.6);
            case 'spiral':
                return 0.5 * Math.sin(beat * 0.4 + ring * 0.5);
            case 'beat':
            case 'none':
            default:
                return 0;
        }
    }
}
