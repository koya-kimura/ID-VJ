// src/scenes/WorkingScene.ts

import p5 from 'p5';
import type { IScene } from "./IScene";
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { Easing } from '../utils/easing';

export class Scene3 implements IScene {
    public name: string = "Working Scene: Line Flow - Rotation";

    private maxOptions: number[] = [
        4, // P0: ライン密度
        3, // P1: 速度
        8, // P2: 線の太さ
        8, // 💡 P3: 進行方向 (8 options)
        4,
        4,
        4,
        1 // P4-P7: 未使用
    ];


    public setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void {
        apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
    }


    public draw(p: p5, tex: p5.Graphics, tex3d: p5.Graphics, apcManager: APCMiniMK2Manager, currentBeat: number): void {

        const textScale = p.pow(2, apcManager.getParamValue(0)) / 2;
        const textStyle = ["fill", "stroke", "random"][apcManager.getParamValue(1) % 3];
        const moveStyle = ["vertsin", "horzswitch"][apcManager.getParamValue(2) % 2];
        const startAngle = (apcManager.getParamValue(3) / (this.maxOptions[3])) * p.TAU;

        tex.push();

        const cols = 24;
        const rows = p.floor(cols * 9 / 16) + 1;
        const cellW = tex.width / cols;
        const cellH = tex.height / rows;

        tex.translate(tex.width / 2, tex.height / 2);
        tex.scale(1.5);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const gx = p.map(col, 0, cols - 1, -tex.width / 2 + cellW / 2, tex.width / 2 - cellW / 2);
                const gy = p.map(row, 0, rows - 1, -tex.height / 2 + cellH / 2, tex.height / 2 - cellH / 2);
                const s = p.min(cellW, cellH) * textScale;
                const dir = col % 2 == 0 ? 1 : -1;
                const str = [..."IDVJ"][(row * cols + col) % 4];

                let x = gx;
                let y = gy;
                let angle = startAngle;
                let scl = 1;
                switch (moveStyle) {
                    case "vertsin":
                        x += p.sin(Easing.easeInOutCirc(p.fract(currentBeat * 0.5)) * p.TAU) * cellW - cellW / 2 + (row % 2 == 0 ? 0 : cellW / 2)
                        y += (currentBeat % 2) * cellH
                        angle = p.map(p.sin(Easing.easeInOutCirc(p.fract(currentBeat * 0.5)) * p.TAU), -1, 1, -p.PI * 0.25, p.PI * 0.25);
                        break;
                    case "horzswitch":
                        x += p.map(Easing.easeInOutCubic(p.abs(currentBeat % 2 - 1)), 0, col % 2 == 0 ? 1 : -1, cellW, -cellW) + (row % 2 == 0 ? 0 : cellW / 2);
                        angle = p.map(Easing.easeInOutCubic(p.abs(p.fract(currentBeat) - 0.5) * 0.5), 0, 1, -0.5, 0.5) * p.PI;
                        scl = p.map(Easing.easeInOutCubic(p.abs(p.fract(currentBeat) - 0.5) * 0.5), 0, 1, 0.5, 1);
                        break;
                }

                tex.push();
                switch (textStyle) {
                    case "fill":
                        tex.fill(255);
                        tex.noStroke();
                        break;
                    case "stroke":
                        tex.noFill();
                        tex.stroke(255);
                        tex.strokeWeight(2);
                        break;
                    case "random":
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
                tex.translate(x, y);
                tex.rotate(angle);
                tex.scale(dir, 1);
                tex.textAlign(p.CENTER, p.CENTER);
                tex.textSize(s * scl);
                tex.text(str, 0, 0);
                tex.pop();
            }
        }
        tex.pop();
    }
}