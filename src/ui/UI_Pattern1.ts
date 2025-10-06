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

    public draw(p: p5, midiManager: APCMiniMK2Manager, bpmManager: BPMManager, tempoIndex: number): void {
        const { width, height } = p;

        // --- 1. 中央の描画スペースの計算 ---
        const centralSquareSize = height;
        const centralStartX = (width - centralSquareSize) / 2;
        const cropWidth = centralStartX;

        const leftUIX = 0;
        const rightUIX = centralStartX + centralSquareSize;

        p.push();
        p.colorMode(p.RGB);
        p.noStroke();

        // --- 2. 左右の黒いクロップエリアの描画 ---
        p.fill(0);
        p.rect(leftUIX, 0, cropWidth, height);
        p.rect(rightUIX, 0, cropWidth, height);

        // --- 3. UI情報の描画 (白で描画) ---
        p.fill(255);
        p.textAlign(p.LEFT, p.TOP);

        // --- 設定変数 ---
        const PADDING = 20;
        const CONTENT_WIDTH = cropWidth - 2 * PADDING;
        const APC_DRAW_SCALE = 0.6; // 描画要素を黒四角形の外側7割程度に収めるためのスケール


        // =================================================================
        // A. 左側UIエリア (日時、BPM、テキストパラメーター)
        // =================================================================
        let currentY = PADDING;

        // 1. 日時情報の表示
        const dateTime = UIUtils.getCurrentDateTime();
        p.textSize(18);
        p.text(dateTime.date, leftUIX + PADDING, currentY); currentY += 25;
        p.text(dateTime.time, leftUIX + PADDING, currentY); currentY += 40;

        // 2. BPMとテンポ情報
        p.textSize(16);
        p.text(`BPM: ${bpmManager.getBPM().toFixed(1)}`, leftUIX + PADDING, currentY); currentY += 20;
        p.text(`Beat: ${tempoIndex}`, leftUIX + PADDING, currentY); currentY += 30;

        // 3. パラメーターのテキスト表示
        p.textSize(14);
        p.text(`Scene ${midiManager.currentSceneIndex} Params:`, leftUIX + PADDING, currentY); currentY += 20;

        const currentScene = midiManager.gridRadioState[midiManager.currentSceneIndex];
        for (let col = 0; col < 8; col++) {
            const param = currentScene[col];
            const currentValue = midiManager.getParamValue(col);

            let displayStr = `P${col}: ${currentValue} (Max ${param.maxOptions})`;

            if (param.isRandom) {
                p.fill(150); // ランダム中は薄いグレー
                displayStr += ` RND`;
            } else {
                p.fill(255);
            }
            p.text(displayStr, leftUIX + PADDING, currentY); currentY += 18;
        }

        // =================================================================
        // B. 右側UIエリア (APC Mini MK2のグラフィカル表示)
        // =================================================================

        // 1. グリッドパッドの描画 (上部に配置)
        const maxPadSize = CONTENT_WIDTH * APC_DRAW_SCALE;
        const padX = p.width - maxPadSize - PADDING;
        const padY = p.height - maxPadSize - PADDING;

        UIUtils.drawGridPads(p, midiManager, padX, padY, maxPadSize);

        p.pop();
    }
}