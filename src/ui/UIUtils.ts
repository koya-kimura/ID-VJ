// src/ui/UIUtils.ts

import p5 from 'p5';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';

// APC Mini MK2の描画用共通ユーティリティ
export class UIUtils {

    /**
     * APC Mini MK2のグリッドパッド (8x8) の状態を描画します。
     * @param p p5.js インスタンス (主にユーティリティ関数用)
     * @param tex 描画ターゲットとなる p5.Graphics バッファ
     * @param midiManager APC Mini MK2 マネージャー
     * @param x X座標 (描画開始位置)
     * @param y Y座標 (描画開始位置)
     * @param size パッド全体の幅または高さ (正方形として描画)
     */
    public static drawGridPads(p: p5, tex: p5.Graphics, midiManager: APCMiniMK2Manager, x: number, y: number, size: number): void {
        if (!tex) return; // バッファが存在しない場合は描画しない

        const PAD_ROWS = 8;
        const PAD_COLS = 8;
        const PAD_GAP = size * 0.01;
        const padSize = (size - PAD_GAP * (PAD_ROWS + 1)) / PAD_ROWS;
        const currentScene = midiManager.gridRadioState[midiManager.currentSceneIndex];

        tex.push();
        tex.translate(x, y);
        tex.rectMode(p.CORNER); // p.CORNERはp5定数なのでpから取得

        for (let col = 0; col < PAD_COLS; col++) {
            for (let row = 0; row < PAD_ROWS; row++) {
                const param = currentScene[col];
                const activeRows = param.maxOptions;

                const xPos = col * (padSize + PAD_GAP) + PAD_GAP;

                const mappedRow = p.map(row, 0, PAD_ROWS - 1, PAD_ROWS - 1, 0);
                const yPos = mappedRow * (padSize + PAD_GAP) + PAD_GAP;

                const APC_ROW_INDEX = PAD_ROWS - 1 - row;

                // 描画コマンドを tex に切り替え
                tex.stroke(255);
                tex.strokeWeight(1);
                tex.noFill();

                if (APC_ROW_INDEX >= activeRows && APC_ROW_INDEX !== 7) {
                    tex.noFill();
                }
                else if (APC_ROW_INDEX === 7) {
                    if (param.isRandom) {
                        tex.fill(255);
                    } else {
                        tex.noFill();
                    }
                }
                else if (APC_ROW_INDEX < activeRows) {
                    const currentValue = midiManager.getParamValue(col);

                    if (APC_ROW_INDEX === currentValue) {
                        tex.fill(255);
                    } else {
                        tex.noFill();
                    }
                }

                tex.rect(xPos, yPos, padSize * 0.85, padSize * 0.85);
            }
        }
        tex.pop();
    }


    /**
     * 9本のフェーダーの値とトグルボタンの状態を描画します。
     */
    public static drawFaders(p: p5, tex: p5.Graphics, midiManager: APCMiniMK2Manager, x: number, y: number, width: number, height: number): void {
        if (!tex) return; // バッファが存在しない場合は描画しない

        const FADER_COUNT = 9;
        const FADER_SPACING_FACTOR = 0.05;
        const totalGap = width * FADER_SPACING_FACTOR;
        const faderWidth = (width - totalGap * (FADER_COUNT - 1)) / FADER_COUNT;

        const barHeight = height * 0.7;
        const buttonSize = height * 0.2;

        const barStrokeWidth = 1;
        const knobSize = faderWidth * 0.4;

        tex.push();
        tex.translate(x, y);
        tex.rectMode(p.CORNER); // p.CORNERはp5定数なのでpから取得
        tex.textAlign(p.CENTER, p.CENTER); // p.CENTERはp5定数なのでpから取得

        for (let i = 0; i < FADER_COUNT; i++) {
            const xPos = i * (faderWidth + totalGap / FADER_COUNT);
            const value = midiManager.faderValues[i];
            const buttonState = midiManager.faderButtonToggleState[i];
            const centerX = xPos + faderWidth / 2;

            // 1. フェーダーセンターラインの描画
            tex.stroke(255);
            tex.strokeWeight(barStrokeWidth);
            tex.line(centerX, 0, centerX, barHeight);

            // 2. フェーダーノブ (四角形) の描画
            const knobY = barHeight * (1 - value);

            tex.noStroke();
            tex.fill(255);
            tex.rectMode(p.CENTER); // p.CENTERはp5定数なのでpから取得
            tex.rect(centerX, knobY, knobSize, knobSize * 0.4);

            // 3. トグルボタンの描画
            const buttonY = barHeight + 20;

            tex.stroke(255);
            tex.strokeWeight(1);

            if (buttonState) {
                tex.fill(255);
            } else {
                tex.noFill();
            }

            tex.rectMode(p.CORNER); // p.CORNERはp5定数なのでpから取得
            tex.rect(centerX - buttonSize / 2, buttonY, buttonSize, buttonSize);
        }
        tex.pop();
    }

    /**
     * 現在の日時と時刻をフォーマットして取得します。
     * @returns { date: string, time: string } 日付と時刻のオブジェクト
     */
    public static getCurrentDateTime(): { date: string, time: string } {
        const now = new Date();
        const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        const date = now.toLocaleDateString(undefined, dateOptions);
        const time = now.toLocaleTimeString(undefined, timeOptions);

        return { date, time };
    }
}