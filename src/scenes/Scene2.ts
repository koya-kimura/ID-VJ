// src/scenes/Scene1.ts (エラー修正版)

import p5 from 'p5';
import type { IScene } from "./IScene";
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';

/**
 * シーン1: オリジナルのJavaScriptコードをそのまま再現したアニメーション
 */
export class Scene1 implements IScene {
    public name: string = "Scene 1: BPM Linked Seed Logic";

    // APCManagerがmaxOptionsをリセットするため、全てのカラムをMax 1に設定
    private maxOptions: number[] = [4, 4, 4, 4, 4, 4, 4, 4];

    public setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void {
        apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
    }

    /**
     * 描画処理
     */
    public draw(p: p5, apcManager: APCMiniMK2Manager, tempoIndex: number): void {
        // 💡 修正: pから必要なメソッドを安全にデストラクト。random()を使用する。
        const { width, height, random, max, TAU } = p;

        // --- 1. currentSeed の BPM/テンポ連動計算 ---
        const currentSeed = p.floor(tempoIndex);

        // randomSeedに大きな定数を乗算して乱数パターンを生成
        p.randomSeed(currentSeed * 4716041);

        // --- パラメータの定義 (全て p.random() と定数で決定) ---

        p.background(0, 200);

        const diagonalLength = p.max(width, height) * Math.sqrt(2);
        const cols = 16;

        // 💡 修正: random(10, 40) の結果を Math.floor() してから *4 を行う
        const rows = 4 * Math.floor(p.random(10, 40));

        // 💡 修正: p.random(1, 5) の結果を Math.floor() してから *2 を行う
        const numSteps = 2 * Math.floor(p.random(1, 5));

        // 💡 修正: p.random(numSteps / 3) の結果を Math.floor() してから *2 を行う
        const patternWidth = Math.floor(p.random(numSteps / 3)) * 2;

        // 💡 修正: p.random(3) の結果を Math.floor() してから Math.pow() を行う
        const groupingFactor = Math.pow(2, Math.floor(p.random(3)));

        // アニメーションの現在のステップ (元のJSロジックに従う)
        const currentStep = Math.floor(p.frameCount * 0.2) % numSteps;

        // --- 2. 描画ロジック ---

        p.push();
        p.translate(width / 2, height / 2);

        p.rotate(TAU * Math.floor(p.random(8)) / 8);

        const tileWidth = diagonalLength / cols;
        const tileHeight = diagonalLength / rows;
        const rectGap = 0;

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {

                // タイルの中心座標
                const xPos = diagonalLength * i / cols - diagonalLength / 2 + tileWidth / 2;
                const yPos = diagonalLength * j / rows - diagonalLength / 2 + tileHeight / 2;

                // タイルグループによる方向の決定
                const isEvenGroup = Math.floor(i / groupingFactor) % 2 === 0;
                const animationDirection = isEvenGroup ? currentStep : numSteps - 1 - currentStep;

                const rowPatternIndex = j % numSteps;

                // 表示範囲の開始と終了
                const patternStart = animationDirection - patternWidth / 2;
                const patternEnd = animationDirection + patternWidth / 2;

                // タイルを表示するかどうかの判定
                const shouldShowTile = (rowPatternIndex >= patternStart) && (rowPatternIndex <= patternEnd);

                if (shouldShowTile) {
                    p.push();
                    p.noStroke();
                    p.fill(255);
                    p.translate(xPos, yPos);
                    p.rectMode(p.CENTER);
                    p.rect(0, 0, tileWidth - rectGap, tileHeight - rectGap);
                    p.pop();
                }
            }
        }
        p.pop();
    }
}