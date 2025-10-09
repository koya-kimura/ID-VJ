// src/scenes/Scene2.ts

import p5 from 'p5';
import type { IScene } from "./IScene";
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';

export class Scene2 implements IScene {
    public name: string = "Scene 2: Line Flow - Rotation";

    private readonly lineDensityOptions = [10, 20, 40, 80];
    private readonly gridCopyOptions = [1, 2, 4, 8];
    private readonly thicknessOptions = [0.01, 0.035, 0.08, 0.14];
    private readonly canvasScaleOptions = [0.5, 1, 2, 4];
    private readonly lengthOptions = [0.2, 0.45, 0.7, 1.0];
    private readonly speedOptions = [2, 6, 12, 20];
    private readonly angleModes = ["vert", "horz", "vertmix", "horzmix", "vert&horz", "diag", "rand"] as const;
    private readonly scatterModes = ["none", "mirror", "dual"] as const;

    private readonly maxOptions: number[] = [
        this.lineDensityOptions.length,
        this.gridCopyOptions.length,
        this.thicknessOptions.length,
        this.canvasScaleOptions.length,
        this.lengthOptions.length,
        this.speedOptions.length,
        this.angleModes.length,
        this.scatterModes.length,
    ];

    public setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void {
        apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
    }

    public draw(p: p5, tex: p5.Graphics, _tex3d: p5.Graphics, apcManager: APCMiniMK2Manager, _currentBeat: number): void {
        const selection = new Array(8).fill(0).map((_, i) => apcManager.getParamValue(i));

        const lineCount = this.lineDensityOptions[selection[0]];
        const gridCopies = this.gridCopyOptions[selection[1]];
        const thickness = this.thicknessOptions[selection[2]];
        const canvasScale = this.canvasScaleOptions[selection[3]];
        const lineLengthScale = this.lengthOptions[selection[4]];
        const speed = this.speedOptions[selection[5]];
        const angleMode = this.angleModes[selection[6]];
        const scatterMode = this.scatterModes[selection[7]];

        tex.push();
        tex.translate(tex.width / 2, tex.height / 2);
        tex.scale(canvasScale);

        const canvasSize = Math.max(tex.width, tex.height) * Math.SQRT2;
        const scatterFlip = scatterMode !== "none";

        for (let i = 0; i < lineCount; i++) {
            const h = canvasSize / lineCount;
            const baseY = (h * i + speed * p.frameCount) % canvasSize - canvasSize / 2;
            const angle = this.resolveAngle(p, angleMode, i);

            tex.push();
            tex.strokeCap(p.SQUARE);
            tex.stroke(255);
            tex.strokeWeight(thickness * canvasSize / lineCount);
            tex.rotate(angle);

            for (let g = 0; g < gridCopies; g++) {
                const length = canvasSize * lineLengthScale;
                const x = p.map(g, 0, gridCopies, -length / 2, length / 2);
                const modY = this.modulateY(baseY, canvasSize, g, scatterMode, lineCount, i);

                tex.push();
                tex.translate(x, modY);
                tex.line(0, 0, length / gridCopies, 0);

                if (scatterFlip) {
                    tex.push();
                    tex.scale(1, -1);
                    tex.line(0, 0, length / gridCopies, 0);
                    tex.pop();
                }

                tex.pop();
            }
            tex.pop();
        }
        tex.pop();
    }

    private resolveAngle(p: p5, mode: typeof this.angleModes[number], index: number): number {
        switch (mode) {
            case "vert":
                return 0;
            case "horz":
                return p.HALF_PI;
            case "vertmix":
                return p.noise(index, 3710) < 0.5 ? 0 : p.PI;
            case "horzmix":
                return p.noise(index, 4897) < 0.5 ? p.HALF_PI : -p.HALF_PI;
            case "vert&horz":
                return p.TWO_PI * p.floor(p.noise(index, 1234) * 16) / 4;
            case "diag":
                return p.PI * 0.25;
            case "rand":
            default:
                return p.TWO_PI * p.noise(index, 41709) * 10;
        }
    }

    private modulateY(base: number, canvasSize: number, copyIndex: number, mode: typeof this.scatterModes[number], lineCount: number, lineIndex: number): number {
        if (mode === "none") {
            return base;
        }
        const mirrored = copyIndex % 2 === 0 ? base : -base;
        if (mode === "dual") {
            const offset = ((lineIndex % 4) - 1.5) * (canvasSize / lineCount) * 0.12;
            return mirrored + offset;
        }
        return mirrored;
    }
}