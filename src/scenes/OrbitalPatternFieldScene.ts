// src/scenes/OrbitalPatternFieldScene.ts

import p5 from 'p5';
import type { IScene } from '../core/IScene';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { Easing } from '../utils/easing';

type MotionMode = 'sizeBound' | 'axisWarp' | 'translate' | 'orbit';
type PatternShape = 'circle' | 'star';
type PatternPosition = 'center' | 'random';
type StrokeMode = 'thin' | 'thick' | 'random';
type FillMode = 'none' | 'fill' | 'fillAlpha' | 'rand';

interface PatternPackage {
    shape: PatternShape;
    position: PatternPosition;
}

/**
 * OrbitalPatternFieldScene
 * -----------------------
 * 放射状のポリゴン／スターを複数組み合わせたフィールドを描く基本シーン。
 * パラメータにより形状、モーション、ノイズ量、塗りモードなどが切り替わる。
 */
export class OrbitalPatternFieldScene implements IScene {
    public name: string = 'Orbital Pattern Field';

    private readonly shapeCountOptions = [1, 2, 4, 8];
    private readonly vertexDetailOptions = [2, 3, 4, 5];
    private readonly radiusScaleOptions = [0.28, 0.36, 0.46, 0.58];
    private readonly motionModes: MotionMode[] = ['sizeBound', 'axisWarp', 'translate', 'orbit'];
    private readonly noiseAmountOptions = [0.0, 0.18, 0.36, 0.6];
    private readonly patternPackages: PatternPackage[] = [
        { shape: 'circle', position: 'center' },
        { shape: 'circle', position: 'random' },
        { shape: 'star', position: 'center' },
        { shape: 'star', position: 'random' },
    ];
    private readonly strokeModes: StrokeMode[] = ['thin', 'thick', 'random'];
    private readonly fillModes: FillMode[] = ['none', 'fill', 'fillAlpha', 'rand'];

    private readonly maxOptions: number[] = [
        this.shapeCountOptions.length,
        this.vertexDetailOptions.length,
        this.radiusScaleOptions.length,
        this.motionModes.length,
        this.noiseAmountOptions.length,
        this.patternPackages.length,
        this.strokeModes.length,
        this.fillModes.length,
    ];

    public setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void {
        apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
    }

    public draw(p: p5, tex: p5.Graphics, _tex3d: p5.Graphics, apcManager: APCMiniMK2Manager, currentBeat: number): void {
        const selection = new Array(8).fill(0).map((_, i) => apcManager.getParamValue(i));

        const shapeCount = this.shapeCountOptions[selection[0]];
        const vertexExponent = this.vertexDetailOptions[selection[1]];
        const radiusScale = this.radiusScaleOptions[selection[2]];
        const motionMode = this.motionModes[selection[3]];
        const noiseAmount = this.noiseAmountOptions[selection[4]];
        const pattern = this.patternPackages[selection[5]];
        const strokeMode = this.strokeModes[selection[6]] ?? 'random';
        const fillMode = this.fillModes[selection[7]] ?? 'none';

        const vertexNum = Math.pow(2, vertexExponent) + 1;
        const minDim = Math.min(tex.width, tex.height);
        const baseRadius = minDim * radiusScale;

        p.push();
        p.randomSeed(p.noise(Math.floor(currentBeat / 2) * 371901) * 8979371);

        tex.push();
        tex.translate(tex.width / 2, tex.height / 2);

        for (let j = 0; j < shapeCount; j++) {
            const ringRatio = (j + 1) / (shapeCount + 1);
            const radius = baseRadius * (0.15 + ringRatio * 0.85);
            const strokeWeight = this.computeStrokeWeight(p, strokeMode, minDim);

            let x = 0;
            let y = 0;
            let rotation = 0;
            if (pattern.position === 'random') {
                x = p.random(-tex.width * 0.45, tex.width * 0.45);
                y = p.random(-tex.height * 0.45, tex.height * 0.45);
                rotation = p.random(p.TWO_PI);
            }

            tex.push();
            tex.translate(x, y);
            tex.rotate(rotation);

            this.applyFillMode(tex, fillMode, currentBeat);
            tex.stroke(255);
            tex.strokeWeight(strokeWeight);

            this.applyMotion(tex, motionMode, currentBeat, minDim, ringRatio);

            tex.beginShape();
            for (let i = 0; i < vertexNum; i++) {
                const index = pattern.shape === 'circle' ? i : (i * 2) % vertexNum;
                const angle = (p.TWO_PI / vertexNum) * index;
                const wobble = noiseAmount === 0
                    ? 0
                    : (p.noise(currentBeat * 0.3 + i * 0.17 + j * 0.11) - 0.5) * noiseAmount * minDim;
                const px = Math.cos(angle) * (radius + wobble);
                const py = Math.sin(angle) * (radius + wobble);
                tex.vertex(px, py);
            }
            tex.endShape(p.CLOSE);
            tex.pop();
        }

        tex.pop();
        p.pop();
    }

    private computeStrokeWeight(p: p5, mode: StrokeMode, minDim: number): number {
        switch (mode) {
            case 'thin':
                return minDim * 0.004;
            case 'thick':
                return minDim * 0.018;
            case 'random':
            default:
                return minDim * p.random(0.005, 0.02);
        }
    }

    private applyFillMode(tex: p5.Graphics, mode: FillMode, beat: number): void {
        const oscillation = Easing.easeOutCubic(Math.abs((beat + 1) % 2 - 1));
        switch (mode) {
            case 'fill':
                tex.fill(255);
                tex.noStroke();
                break;
            case 'fillAlpha':
                tex.fill(255, 40 + 180 * oscillation);
                tex.noStroke();
                break;
            case 'rand':
                if (Math.random() > 0.5) {
                    tex.fill(255);
                    tex.noStroke();
                } else {
                    tex.noFill();
                }
                break;
            case 'none':
            default:
                tex.noFill();
                break;
        }
    }

    private applyMotion(tex: p5.Graphics, mode: MotionMode, beat: number, minDim: number, ringRatio: number): void {
        const beatPhase = Math.abs((beat % 1) - 0.5) * 2;
        const eased = Easing.easeOutCubic(beatPhase);
        switch (mode) {
            case 'sizeBound': {
                const scale = 0.55 + 0.55 * Easing.easeInOutCubic(beatPhase);
                tex.scale(scale);
                break;
            }
            case 'axisWarp':
                tex.scale(0.65 + 0.85 * eased, 1.05 - 0.25 * eased);
                break;
            case 'translate':
                tex.translate((eased - 0.5) * minDim * 0.35, 0);
                tex.scale(0.85 + 0.35 * eased, 1.0 - 0.25 * eased);
                break;
            case 'orbit':
                tex.rotate(beat * 0.35 + ringRatio * 0.6);
                break;
        }
    }
}
