// src/ui/UI_Pattern1.ts (UI_Pattern2からロジックを移動し、インデックス1に対応)

import p5 from 'p5';
import type { IUIOverlay } from './IUIOverlay';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { BPMManager } from '../rhythm/BPMManager';
import { UIUtils } from './UIUtils'; // 描画ユーティリティをインポート

/**
 * UIパターン1: 画面中央を正方形にクロップし、左右の黒い領域にAPCの状態を描画するオーバーレイ。
 */
export class UI_Pattern1 implements IUIOverlay {
    public name: string = "Pattern 1: Side Crop UI";

    // 💡 修正: drawのシグネチャを変更。texをメインの描画ターゲットとする
    public draw(p: p5, tex: p5.Graphics, midiManager: APCMiniMK2Manager, bpmManager: BPMManager, currentBeat: number): void {
        const { width, height } = p;

        // --- 1. 中央の描画スペースの計算 ---
        const centralSquareSize = height;
        const centralStartX = (width - centralSquareSize) / 2;
        const cropWidth = centralStartX;

        const leftUIX = 0;
        const rightUIX = centralStartX + centralSquareSize;

        // 💡 tex の描画コンテキストを操作
        tex.push();
        tex.colorMode(p.RGB);
        tex.noStroke();

        // --- 2. 左右の黒いクロップエリアの描画 ---
        // メインキャンバスの代わりにtexに描画
        tex.fill(0);
        tex.rect(leftUIX, 0, cropWidth, height);
        tex.rect(rightUIX, 0, cropWidth, height);

        // --- 3. UI情報の描画 (白で描画) ---
        tex.fill(255);
        tex.textAlign(p.LEFT, p.TOP);

        // --- 設定変数 ---
        const PADDING = 20;
        const CONTENT_WIDTH = cropWidth - 2 * PADDING;
        const APC_DRAW_SCALE = 0.6;


        // =================================================================
        // A. 左側UIエリア (日時、BPM、テキストパラメーター)
        // =================================================================
        let currentY = PADDING;

        // 1. 日時情報の表示
        const dateTime = UIUtils.getCurrentDateTime();
        tex.textSize(18);
        tex.text(dateTime.date, leftUIX + PADDING, currentY); currentY += 25;
        tex.text(dateTime.time, leftUIX + PADDING, currentY); currentY += 40;

        // 2. BPMとテンポ情報
        tex.textSize(16);
        tex.text(`BPM: ${bpmManager.getBPM().toFixed(1)}`, leftUIX + PADDING, currentY); currentY += 20;
        tex.text(`Beat: ${currentBeat.toFixed(2)}`, leftUIX + PADDING, currentY); currentY += 30; // 💡 小数点表示

        // 3. パラメーターのテキスト表示
        tex.textSize(14);
        tex.text(`Scene ${midiManager.currentSceneIndex} Params:`, leftUIX + PADDING, currentY); currentY += 20;

        const currentScene = midiManager.gridRadioState[midiManager.currentSceneIndex];
        for (let col = 0; col < 8; col++) {
            const param = currentScene[col];
            const currentValue = midiManager.getParamValue(col);

            let displayStr = `P${col}: ${currentValue} (Max ${param.maxOptions})`;

            if (param.isRandom) {
                tex.fill(150); // ランダム中は薄いグレー
                displayStr += ` RND`;
            } else {
                tex.fill(255);
            }
            tex.text(displayStr, leftUIX + PADDING, currentY); currentY += 18;
        }

        // =================================================================
        // B. 右側UIエリア (APC Mini MK2のグラフィカル表示)
        // =================================================================

        currentY = PADDING;

        // 1. グリッドパッドの描画 (上部に配置)
        const maxPadSize = CONTENT_WIDTH * APC_DRAW_SCALE;
        // padXを中央に配置するロジックを右側エリアの左端から計算
        const padX = rightUIX + PADDING + (CONTENT_WIDTH - maxPadSize) / 2;

        // UIUtils関数を呼び出し、描画ターゲットとして tex を渡す
        UIUtils.drawGridPads(p, tex, midiManager, padX, currentY, maxPadSize);
        currentY += maxPadSize + 30; // パッドの高さ + 余白

        // 2. シーンボタンの状態表示 (簡易) - グリッドパッドの下に配置
        tex.textSize(16);
        tex.fill(255);
        tex.text(`Scene Launch:`, rightUIX + PADDING, currentY);
        currentY += 20;

        // 3. フェーダーの描画 (下部に配置)
        const faderWidth = CONTENT_WIDTH * APC_DRAW_SCALE;
        const faderHeight = height * 0.35;
        const faderX = rightUIX + PADDING + (CONTENT_WIDTH - faderWidth) / 2;
        const faderY = height - faderHeight - PADDING;

        // UIUtils関数を呼び出し、描画ターゲットとして tex を渡す
        UIUtils.drawFaders(p, tex, midiManager, faderX, faderY, faderWidth, faderHeight);

        tex.pop();
    }
}