// src/scenes/RadialBloomScene.ts

import p5 from 'p5';
import type { IScene } from '../core/IScene';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { Easing } from '../utils/easing';

type ReturnMode = 'bounce' | 'oneway' | 'linger' | 'reverse';
type DestinationMode = 'line' | 'ring' | 'random' | 'dual';
type MotionProfile = 'smooth' | 'wave' | 'zigzag' | 'stutter';
type PhaseMode = 'uniform' | 'spread' | 'cascade' | 'random';

/**
 * RadialBloomScene
 * ----------------
 * 複数の円が軌跡を描きながら外側へ膨らむシーン。配置やモーションをパラメータで切り替える。
 */
export class RadialBloomScene implements IScene {
    public name: string = 'Radial Bloom';

    private readonly circleCountOptions = [5, 7, 9, 12];
    private readonly circleRadiusOptions = [0.09, 0.11, 0.135, 0.165];
    private readonly travelRadiusOptions = [0.22, 0.36, 0.5, 0.65];
    private readonly loopCountOptions = [1, 2, 4, 6];
    private readonly returnModes: ReturnMode[] = ['bounce', 'oneway', 'linger', 'reverse'];
    private readonly destinationModes: DestinationMode[] = ['line', 'ring', 'random', 'dual'];
    private readonly motionProfiles: MotionProfile[] = ['smooth', 'wave', 'zigzag', 'stutter'];
    private readonly phaseModes: PhaseMode[] = ['uniform', 'spread', 'cascade', 'random'];

    private readonly maxOptions: number[] = [
        this.circleCountOptions.length,
        this.circleRadiusOptions.length,
        this.travelRadiusOptions.length,
        this.loopCountOptions.length,
        this.returnModes.length,
        this.destinationModes.length,
        this.motionProfiles.length,
        this.phaseModes.length,
    ];

    public setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void {
        apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
    }

    public draw(p: p5, tex: p5.Graphics, _tex3d: p5.Graphics, apcManager: APCMiniMK2Manager, currentBeat: number): void {
        const selection = new Array(8).fill(0).map((_, i) => apcManager.getParamValue(i));

        const circleCount = this.circleCountOptions[selection[0]];
        const circleRadiusScale = this.circleRadiusOptions[selection[1]];
        const travelRadiusScale = this.travelRadiusOptions[selection[2]];
        const loopCount = this.loopCountOptions[selection[3]];
        const returnMode = this.returnModes[selection[4]];
        const destinationMode = this.destinationModes[selection[5]];
        const motionProfile = this.motionProfiles[selection[6]];
        const phaseMode = this.phaseModes[selection[7]];

        tex.background(0);
        tex.push();
        tex.translate(tex.width / 2, tex.height / 2);
        tex.noStroke();

        const minDim = Math.min(tex.width, tex.height);
        const circleRadius = minDim * circleRadiusScale * this.countSizeAttenuation(circleCount);
        const travelRadius = minDim * travelRadiusScale;

        const beatPhase = this.mod1(currentBeat);
        for (let i = 0; i < circleCount; i++) {
            const indexRatio = circleCount > 1 ? i / (circleCount - 1) : 0;
            const phaseOffset = this.computePhaseOffset(phaseMode, i, circleCount);
            const localPhase = this.mod1(beatPhase + phaseOffset);

            const angularProgress = loopCount * localPhase * p.TWO_PI;
            const travelProgress = this.travelProgress(returnMode, localPhase);
            const motionOffset = this.motionOffset(motionProfile, localPhase, i, minDim);

            const destination = this.destinationPoint(destinationMode, travelRadius, angularProgress, indexRatio, i);

            const x = destination.x * travelProgress + motionOffset.x;
            const y = destination.y * travelProgress + motionOffset.y;

            const alpha = 180 + 60 * travelProgress;

            tex.fill(255, alpha);
            tex.ellipse(x, y, circleRadius * 2, circleRadius * 2);
        }

        tex.pop();
    }

    private countSizeAttenuation(circleCount: number): number {
        if (circleCount <= 0) {
            return 1;
        }

        const baseCount = this.circleCountOptions[0];
        const ratio = Math.min(1, baseCount / circleCount);

        return Math.pow(ratio, 0.55);
    }

    private destinationPoint(mode: DestinationMode, radius: number, angle: number, ratio: number, index: number): { x: number; y: number } {
        switch (mode) {
            case 'line': {
                const offset = (ratio - 0.5) * 2;
                return { x: offset * radius, y: 0 };
            }
            case 'random': {
                const seed = Math.sin(index * 127.31) * 43758.5453;
                const randAngle = (seed - Math.floor(seed)) * Math.PI * 2;
                const randRadius = radius * (0.65 + 0.35 * ((Math.cos(index * 53.17) + 1) * 0.5));
                return {
                    x: Math.cos(randAngle) * randRadius,
                    y: Math.sin(randAngle) * randRadius,
                };
            }
            case 'dual': {
                const ring = index % 2 === 0 ? 0.6 : 1;
                return {
                    x: Math.cos(angle) * radius * ring,
                    y: Math.sin(angle) * radius * ring,
                };
            }
            case 'ring':
            default:
                return {
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius,
                };
        }
    }

    private travelProgress(mode: ReturnMode, phase: number): number {
        switch (mode) {
            case 'bounce': {
                const folded = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
                return Easing.easeInOutCubic(folded);
            }
            case 'linger': {
                if (phase < 0.4) {
                    return Easing.easeOutCubic(phase / 0.4);
                }
                return 1 - 0.15 * Easing.easeInCubic((phase - 0.4) / 0.6);
            }
            case 'reverse': {
                const direction = phase < 0.5 ? phase * 2 : (phase - 0.5) * 2;
                return Easing.easeInOutCubic((phase < 0.5 ? direction : 1 - direction));
            }
            case 'oneway':
            default:
                return Easing.easeOutCubic(phase);
        }
    }

    private motionOffset(profile: MotionProfile, phase: number, index: number, scale: number): { x: number; y: number } {
        switch (profile) {
            case 'wave': {
                const amp = scale * 0.025;
                const wave = Math.sin((phase + index * 0.1) * Math.PI * 2);
                return { x: wave * amp, y: Math.cos((phase * 0.5 + index * 0.05) * Math.PI * 2) * amp };
            }
            case 'zigzag': {
                const ampX = scale * 0.02;
                const ampY = scale * 0.015;
                const zig = ((phase * 4 + index * 0.2) % 2) - 1;
                return { x: Math.sign(zig) * ampX, y: zig * ampY };
            }
            case 'stutter': {
                const step = Math.floor((phase * 4) % 4) / 3;
                const jitter = Math.sin(index * 17.3) * scale * 0.012;
                return { x: jitter * step, y: -jitter * (1 - step) };
            }
            case 'smooth':
            default:
                return { x: 0, y: 0 };
        }
    }

    private computePhaseOffset(mode: PhaseMode, index: number, count: number): number {
        switch (mode) {
            case 'spread':
                return (index / Math.max(1, count)) * 0.5;
            case 'cascade':
                return (index / Math.max(1, count - 1)) * 0.25;
            case 'random':
                return ((Math.sin(index * 91.7) + 1) * 0.5) * 0.5;
            case 'uniform':
            default:
                return 0;
        }
    }

    private mod1(value: number): number {
        return ((value % 1) + 1) % 1;
    }
}
