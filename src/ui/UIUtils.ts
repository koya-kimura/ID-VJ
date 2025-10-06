// src/ui/UIUtils.ts

import p5 from 'p5';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';

// APC Mini MK2の描画用共通ユーティリティ
export class UIUtils {

    /**
     * APC Mini MK2のグリッドパッド (8x8) の状態を描画します。
     * ... (drawGridPads メソッドは変更なし) ...
     */
    public static drawGridPads(p: p5, midiManager: APCMiniMK2Manager, x: number, y: number, size: number): void {
        const PAD_ROWS = 8;
        const PAD_COLS = 8;
        const PAD_GAP = size * 0.01;
        const padSize = (size - PAD_GAP * (PAD_ROWS + 1)) / PAD_ROWS;
        const currentScene = midiManager.gridRadioState[midiManager.currentSceneIndex];

        p.push();
        p.translate(x, y);
        p.rectMode(p.CORNER);

        for (let col = 0; col < PAD_COLS; col++) {
            for (let row = 0; row < PAD_ROWS; row++) {
                const param = currentScene[col];
                const activeRows = param.maxOptions;

                const xPos = col * (padSize + PAD_GAP) + PAD_GAP;

                const mappedRow = p.map(row, 0, PAD_ROWS - 1, PAD_ROWS - 1, 0);
                const yPos = mappedRow * (padSize + PAD_GAP) + PAD_GAP;

                const APC_ROW_INDEX = PAD_ROWS - 1 - row;

                p.stroke(255);
                p.strokeWeight(1);
                p.noFill();

                if (APC_ROW_INDEX >= activeRows && APC_ROW_INDEX !== 7) {
                    p.noFill();
                }
                else if (APC_ROW_INDEX === 7) {
                    if (param.isRandom) {
                        p.fill(255);
                    } else {
                        p.noFill();
                    }
                }
                else if (APC_ROW_INDEX < activeRows) {
                    const currentValue = midiManager.getParamValue(col);

                    if (APC_ROW_INDEX === currentValue) {
                        p.fill(255);
                    } else {
                        p.noFill();
                    }
                }

                p.rect(xPos, yPos, padSize * 0.85, padSize * 0.85);
            }
        }
        p.pop();
    }


    /**
     * 9本のフェーダーの値とトグルボタンの状態を描画します。
     */
    public static drawFaders(p: p5, midiManager: APCMiniMK2Manager, x: number, y: number, width: number, height: number): void {
        const FADER_COUNT = 9;
        const FADER_SPACING_FACTOR = 0.05;
        const totalGap = width * FADER_SPACING_FACTOR;
        const faderWidth = (width - totalGap * (FADER_COUNT - 1)) / FADER_COUNT;

        const barHeight = height * 0.7;
        const buttonSize = height * 0.2;

        const barStrokeWidth = 1;
        const knobSize = faderWidth * 0.4;

        p.push();
        p.translate(x, y);
        p.rectMode(p.CORNER);
        p.textAlign(p.CENTER, p.CENTER);

        for (let i = 0; i < FADER_COUNT; i++) {
            const xPos = i * (faderWidth + totalGap / FADER_COUNT);
            const value = midiManager.faderValues[i];
            const buttonState = midiManager.faderButtonToggleState[i];
            const centerX = xPos + faderWidth / 2;

            // 1. フェーダーセンターラインの描画
            p.stroke(255);
            p.strokeWeight(barStrokeWidth);
            p.line(centerX, 0, centerX, barHeight);

            // 2. フェーダーノブ (四角形) の描画
            const knobY = barHeight * (1 - value);

            p.noStroke();
            p.fill(255);
            p.rectMode(p.CENTER);
            p.rect(centerX, knobY, knobSize, knobSize * 0.4);

            // 3. トグルボタンの描画
            const buttonY = barHeight + 20;

            p.stroke(255);
            p.strokeWeight(1);

            if (buttonState) {
                p.fill(255);
            } else {
                p.noFill();
            }

            p.rectMode(p.CORNER);
            p.rect(centerX - buttonSize / 2, buttonY, buttonSize, buttonSize);
        }
        p.pop();
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