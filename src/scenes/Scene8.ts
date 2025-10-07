// src/scenes/Scene8.ts

import p5 from 'p5';
import type { IScene } from "./IScene";
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';

/**
 * シーン1: オリジナルのJavaScriptコードをそのまま再現したアニメーション
 */
export class Scene8 implements IScene {
    public name: string = "Scene8";

    // APCManagerがmaxOptionsをリセットするため、全てのカラムをMax 1に設定
    private maxOptions: number[] = [4, 4, 4, 4, 4, 4, 4, 4];

    public setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void {
        apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
    }

    /**
     * 描画処理
     */
    public draw(p: p5, apcManager: APCMiniMK2Manager, tempoIndex: number): void {
        p.push();
        p.background(255, 0, 0);
        p.pop();
    }
}