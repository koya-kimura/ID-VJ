// src/scenes/Scene3.ts

import p5 from 'p5';
import type { IScene } from "./IScene";
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { Easing } from '../utils/easing';

export class Scene3 implements IScene {
    public name: string = "Scene 3: Glyph Cascade";

    private readonly columnOptions = [12, 16, 20, 24];
    private readonly sizeOptions = [0.45, 0.62, 0.85, 1.1];
    private readonly amplitudeOptions = [0.35, 0.55, 0.85, 1.2];
    private readonly textStyleOptions = ["fill", "stroke", "random", "alternate"] as const;
    private readonly motionModeOptions = ["vertsin", "horzswitch", "slant", "pulse"] as const;
    private readonly angleOffsetOptions = [0, Math.PI * 0.1, Math.PI * 0.25, Math.PI * 0.5];
    private readonly distortionOptions = ["none", "mirror", "strobe", "tilt"] as const;
    private readonly decorationOptions = ["none", "underline", "shadow"] as const;

    private readonly maxOptions: number[] = [
        this.columnOptions.length,
        this.sizeOptions.length,
        this.amplitudeOptions.length,
        this.textStyleOptions.length,
        this.motionModeOptions.length,
        this.angleOffsetOptions.length,
        this.distortionOptions.length,
        this.decorationOptions.length
    ];

    public setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void {
        apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
    }

    public draw(p: p5, tex: p5.Graphics, _tex3d: p5.Graphics, apcManager: APCMiniMK2Manager, currentBeat: number): void {
        const selections = new Array(8).fill(0).map((_, i) => apcManager.getParamValue(i));

        const cols = this.columnOptions[selections[0]];
        const textScale = this.sizeOptions[selections[1]];
        const travel = this.amplitudeOptions[selections[2]];
        const textStyle = this.textStyleOptions[selections[3]];
        const motionMode = this.motionModeOptions[selections[4]];
        const angleOffset = this.angleOffsetOptions[selections[5]];
        const distortionMode = this.distortionOptions[selections[6]];
        const decorationMode = this.decorationOptions[selections[7]];

        tex.push();

        const rows = Math.floor(cols * 9 / 16) + 1;
        const cellW = tex.width / cols;
        const cellH = tex.height / rows;

        tex.translate(tex.width / 2, tex.height / 2);
        tex.scale(1.35);

        const beatPhase = p.fract(currentBeat);
        const beatEase = Easing.easeInOutCubic(p.abs(beatPhase - 0.5) * 2);
        const vertEase = Easing.easeInOutCirc(p.fract(currentBeat * 0.5));

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const gx = p.map(col, 0, cols - 1, -tex.width / 2 + cellW / 2, tex.width / 2 - cellW / 2);
                const gy = p.map(row, 0, rows - 1, -tex.height / 2 + cellH / 2, tex.height / 2 - cellH / 2);
                const baseScale = Math.min(cellW, cellH) * textScale;
                const dir = col % 2 === 0 ? 1 : -1;
                const glyph = "IDVJ"[(row * cols + col) % 4];

                const motion = this.resolveMotion(p, motionMode, {
                    gx,
                    gy,
                    cellW,
                    cellH,
                    travel,
                    beatPhase,
                    beatEase,
                    vertEase,
                    row,
                    col,
                    currentBeat
                });

                const renderState = this.resolveDistortion(distortionMode, {
                    scale: baseScale,
                    rotation: angleOffset,
                    dir,
                    beatEase,
                    beatPhase
                });

                tex.push();
                this.applyTextStyle(tex, p, textStyle, row, col);
                tex.translate(motion.x, motion.y);
                tex.rotate(motion.angle + renderState.rotation);
                tex.scale(renderState.dir * renderState.scaleMod, renderState.scaleModY);
                tex.textAlign(p.CENTER, p.CENTER);
                tex.textSize(baseScale * motion.scale * renderState.scaleMod);
                tex.text(glyph, 0, 0);
                this.drawDecoration(tex, decorationMode, baseScale * motion.scale * renderState.scaleMod, glyph);
                tex.pop();
            }
        }
        tex.pop();
    }

    private resolveMotion(p: p5, mode: typeof this.motionModeOptions[number], input: {
        gx: number;
        gy: number;
        cellW: number;
        cellH: number;
        travel: number;
        beatPhase: number;
        beatEase: number;
        vertEase: number;
        row: number;
        col: number;
        currentBeat: number;
    }): { x: number; y: number; angle: number; scale: number } {
        const { gx, gy, cellW, cellH, travel, beatPhase, beatEase, vertEase, row, col, currentBeat } = input;

        let x = gx;
        let y = gy;
        let angle = 0;
        let scale = 1;

        switch (mode) {
            case "vertsin":
                x += Math.sin(vertEase * Math.PI * 2) * cellW * travel - cellW * travel * 0.5 + (row % 2 === 0 ? 0 : cellW * 0.5);
                y += ((currentBeat + row * 0.125) % 2) * cellH * travel;
                angle = p.map(Math.sin(vertEase * Math.PI * 2), -1, 1, -Math.PI * 0.3, Math.PI * 0.3);
                break;
            case "horzswitch":
                x += p.map(beatEase, 0, col % 2 === 0 ? 1 : -1, cellW * travel, -cellW * travel) + (row % 2 === 0 ? 0 : cellW * 0.5);
                angle = p.map(beatEase, 0, 1, -0.5, 0.5) * Math.PI * travel;
                scale = p.map(beatEase, 0, 1, 0.6, 1);
                break;
            case "slant":
                x += (beatPhase * 2 - 1) * cellW * travel;
                y += (beatPhase * 2 - 1) * cellH * travel * 0.65;
                angle = Math.PI * 0.15 * Math.sin(currentBeat * Math.PI * 0.5 + col * 0.2);
                scale = 0.85 + 0.2 * Math.sin(currentBeat * Math.PI + row * 0.3);
                break;
            case "pulse":
            default:
                const pulse = 0.5 + 0.5 * Math.sin(Math.PI * 2 * (currentBeat + row * 0.1));
                y += (pulse - 0.5) * cellH * travel * 1.6;
                angle = (col % 2 === 0 ? -1 : 1) * Math.PI * 0.1 * pulse;
                scale = 0.7 + pulse * 0.6;
                break;
        }

        return { x, y, angle, scale };
    }

    private resolveDistortion(mode: typeof this.distortionOptions[number], input: {
        scale: number;
        rotation: number;
        dir: number;
        beatEase: number;
        beatPhase: number;
    }): { rotation: number; scaleMod: number; scaleModY: number; dir: number } {
        const { rotation, dir, beatEase, beatPhase } = input;
        let scaleMod = 1;
        let scaleModY = 1;
        let rot = rotation;
        let direction = dir;

        switch (mode) {
            case "mirror":
                direction *= beatPhase > 0.5 ? -1 : 1;
                rot += (beatPhase > 0.5 ? 1 : -1) * Math.PI * 0.05;
                break;
            case "strobe":
                scaleMod = beatEase > 0.7 ? 1.2 : 0.85;
                scaleModY = beatEase > 0.7 ? 0.85 : 1.2;
                break;
            case "tilt":
                rot += (beatPhase - 0.5) * Math.PI * 0.2;
                scaleMod = 0.9 + Math.abs(beatPhase - 0.5) * 0.4;
                break;
            case "none":
            default:
                break;
        }

        return { rotation: rot, scaleMod, scaleModY, dir: direction };
    }

    private applyTextStyle(tex: p5.Graphics, p: p5, style: typeof this.textStyleOptions[number], row: number, col: number): void {
        switch (style) {
            case "fill":
                tex.fill(255);
                tex.noStroke();
                break;
            case "stroke":
                tex.noFill();
                tex.stroke(255);
                tex.strokeWeight(2);
                break;
            case "alternate":
                if ((row + col) % 2 === 0) {
                    tex.fill(255);
                    tex.noStroke();
                } else {
                    tex.noFill();
                    tex.stroke(255);
                    tex.strokeWeight(2);
                }
                break;
            case "random":
            default:
                if (p.noise(col * 471091, row * 89123) > 0.5) {
                    tex.fill(255);
                    tex.noStroke();
                }
                else {
                    tex.noFill();
                    tex.stroke(255);
                    tex.strokeWeight(2);
                }
                break;
        }
    }

    private drawDecoration(tex: p5.Graphics, mode: typeof this.decorationOptions[number], size: number, glyph: string): void {
        switch (mode) {
            case "underline":
                tex.push();
                tex.noFill();
                tex.stroke(255);
                tex.strokeWeight(size * 0.05);
                tex.line(-size * 0.4, size * 0.55, size * 0.4, size * 0.55);
                tex.pop();
                break;
            case "shadow":
                tex.push();
                tex.fill(40);
                tex.noStroke();
                tex.textSize(size * 0.9);
                tex.text(glyph, size * 0.08, size * 0.08);
                tex.pop();
                break;
            case "none":
            default:
                break;
        }
    }
}