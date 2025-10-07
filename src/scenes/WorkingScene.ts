// src/scenes/WorkingScene.ts

import p5 from 'p5';
import type { IScene } from "./IScene";
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';

export class WorkingScene implements IScene {
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

        tex.push();
        tex.background(0);
        tex.pop();
    }
}