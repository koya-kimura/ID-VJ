// src/ui/UI_Pattern1.ts (UI_Pattern2からロジックを移動し、インデックス1に対応)

import p5 from 'p5';
import type { IUIOverlay } from './IUIOverlay';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { BPMManager } from '../rhythm/BPMManager';
import { Easing } from '../utils/easing';

/**
 * UIパターン1: 画面中央を正方形にクロップし、左右の黒い領域にAPCの状態を描画するオーバーレイ。
 */
export class UI_Pattern1 implements IUIOverlay {
    public name: string = "Pattern 1: Side Crop UI";

    // 💡 修正: drawのシグネチャを変更。texをメインの描画ターゲットとする
    public draw(p: p5, tex: p5.Graphics, midiManager: APCMiniMK2Manager, bpmManager: BPMManager, currentBeat: number): void {

        tex.clear();
        tex.push();
        const centralSquareSize = p.height;
        const rectSpaceWidth = (p.width - centralSquareSize) * 0.5;
        tex.noStroke();
        tex.fill(0);
        tex.rect(0, 0, rectSpaceWidth, p.height);
        tex.rect(tex.width - rectSpaceWidth, 0, rectSpaceWidth, p.height);

        // pad
        const PAD_ROWS = 8;
        const PAD_COLS = 8;
        const padSize = rectSpaceWidth * 0.8 / PAD_ROWS;
        const drawAreaLength = padSize * PAD_ROWS;
        const gap = (rectSpaceWidth - drawAreaLength) * 0.5;
        const currentScene = midiManager.gridRadioState[midiManager.currentSceneIndex];

        tex.push();
        tex.translate(gap, tex.height-gap-padSize*PAD_ROWS);
        tex.rectMode(p.CORNER); // p.CORNERはp5定数なのでpから取得

        for (let col = 0; col < PAD_COLS; col++) {
            for (let row = 0; row < PAD_ROWS; row++) {
                const param = currentScene[col];
                const activeRows = param.maxOptions;

                const xPos = col * padSize + padSize * 0.5;
                const yPos = row * padSize + padSize * 0.5;

                // 描画コマンドを tex に切り替え
                tex.stroke(255);
                tex.strokeWeight(1);
                tex.noFill();

                if (row >= activeRows && row !== 7) {
                    tex.noFill();
                }
                else if (row === 7) {
                    if (param.isRandom) {
                        tex.fill(255);
                    } else {
                        tex.noFill();
                    }
                }
                else if (row < activeRows) {
                    const currentValue = midiManager.getParamValue(col);

                    if (row === currentValue) {
                        tex.fill(255);
                    } else {
                        tex.noFill();
                    }
                }

                tex.rect(xPos, yPos, padSize * 0.6, padSize * 0.6);
            }
        }
        tex.pop();

        // fader
        const FADER_COUNT = 9;

        tex.push();
        tex.translate(tex.width - drawAreaLength - gap, tex.height - drawAreaLength - gap);

        for (let i = 0; i < FADER_COUNT; i++) {
            const xPos = i * drawAreaLength / FADER_COUNT + drawAreaLength * 0.5 / FADER_COUNT;
            const value = Easing.easeInOutQuint(midiManager.faderValues[i]);
            const buttonState = midiManager.faderButtonToggleState[i];
            const knobY = drawAreaLength * (1 - value) * 0.8;
            const knobSize = drawAreaLength * 0.5 / FADER_COUNT;

            // 1. フェーダーセンターラインの描画
            tex.stroke(255);
            tex.strokeWeight(2);
            tex.line(xPos, 0, xPos, drawAreaLength * 0.8);
            tex.line(xPos - knobSize * 0.5, 0, xPos + knobSize * 0.5, 0);

            // 2. フェーダーノブ (四角形) の描画

            tex.noStroke();
            tex.fill(255);
            tex.rectMode(p.CENTER);
            tex.rect(xPos, knobY, knobSize * 1.5, knobSize);

            // 3. トグルボタンの描画
            const buttonY = drawAreaLength * 0.9;

            tex.stroke(255);
            tex.strokeWeight(1);

            if (buttonState) {
                tex.fill(255);
            } else {
                tex.noFill();
            }

            tex.rectMode(p.CENTER);
            tex.rect(xPos, buttonY, knobSize, knobSize);
        }
        tex.pop();

        // text
        tex.textFont("Helvetica");
        tex.fill(255);
        tex.textAlign(p.CENTER, p.CENTER);
        tex.push();
        tex.textSize(p.min(tex.width, tex.height) * 0.5);
        tex.translate(rectSpaceWidth, tex.height * 0.25);
        tex.text("ID", 0, 0);
        tex.pop();

        tex.push();
        tex.textSize(p.min(tex.width, tex.height) * 0.2);
        tex.translate(rectSpaceWidth + tex.width * 0.5, tex.height * 0.25);
        tex.rotate(p.HALF_PI)
        tex.text("ID", 0, 0);
        tex.text("ID", 0, tex.height * 0.2);
        tex.text("ID", 0, -tex.height * 0.2);
        tex.pop();

        // final
        tex.pop();
    }
}