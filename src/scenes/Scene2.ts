// src/scenes/WorkingScene.ts

import p5 from 'p5';
import type { IScene } from "./IScene";
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';

export class Scene2 implements IScene {
    public name: string = "Working Scene: Line Flow - Rotation";

    private maxOptions: number[] = [
        4, // P0: ライン密度
        5, // P1: 速度
        8, // P2: 線の太さ
        4, // 💡 P3: 進行方向 (8 options)
        4,
        4,
        4,
        1 // P4-P7: 未使用
    ];


    public setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void {
        apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
    }


    public draw(p: p5, tex: p5.Graphics, apcManager: APCMiniMK2Manager, currentBeat: number): void {

        const lineNum = p.pow(2, apcManager.getParamValue(0)) * 10;
        const speed = p.map(p.pow(apcManager.getParamValue(1)/this.maxOptions[1], 2), 0, 1, 1, 20);
        const angleMode = ["vert", "horz", "vertmix", "horzmix", "vert&horz", "diag", "rand"][apcManager.getParamValue(2) % 8];
        const lineLengthScl = p.map(apcManager.getParamValue(3)/this.maxOptions[3], 0, 1, 0.1, 1.0);
        const lineWeightScl = p.map(p.pow(apcManager.getParamValue(4)/this.maxOptions[4], 2), 0, 1, 0.01, 0.8);
        const gridNum = p.pow(2, p.floor(apcManager.getParamValue(5)/this.maxOptions[5]*4)); // 1,2,4,8
        const canvasScl = p.pow(2, p.floor(apcManager.getParamValue(6) / this.maxOptions[6] * 4)) / 2; // 1,2,4,8

        tex.push();
        tex.background(0);
        tex.translate(tex.width / 2, tex.height / 2);
        tex.scale(canvasScl);

        const canvasSize = p.max(tex.width, tex.height) * p.sqrt(2);

        for (let i = 0; i < lineNum; i++) {
            const h = canvasSize / lineNum;
            const y = (h * i + speed * p.frameCount) % canvasSize - canvasSize / 2;
            let angle = 0;
            switch (angleMode) {
                case "vert": angle = 0; break;
                case "horz": angle = p.HALF_PI; break;
                case "vertmix": angle = (p.noise(i, 3710) < 0.5) ? 0 : p.PI; break;
                case "horzmix": angle = (p.noise(i, 4897) < 0.5) ? p.HALF_PI : -p.HALF_PI; break;
                case "vert&horz": angle = p.TAU * p.floor(p.noise(i, 1234)*16)/4; break;
                case "diag": angle = p.PI * 0.25; break;
                case "rand": angle = p.TAU * p.noise(i, 41709) * 10; break;
            }

            tex.push();
            tex.strokeCap(p.SQUARE);
            tex.stroke(255);
            tex.strokeWeight(lineWeightScl * canvasSize / lineNum);
            tex.rotate(angle);

            for(let g=0; g<gridNum; g++){
                const l = canvasSize * lineLengthScl;
                const x = p.map(g, 0, gridNum, -l/2, l/2);
                const ny = (g % 2 == 0) ? y : p.map(y, -canvasSize/2, canvasSize/2, canvasSize/2, -canvasSize/2);

                tex.push();
                tex.translate(x, ny);
                tex.line(0, 0, l/gridNum, 0);
                tex.pop();
            }
            tex.pop();
        }
        tex.pop();
    }
}