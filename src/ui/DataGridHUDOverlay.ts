// src/ui/DataGridHUDOverlay.ts

import p5 from 'p5';
import type { IUIOverlay } from '../core/IUIOverlay';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { BPMManager } from '../rhythm/BPMManager';

/**
 * DataGridHUDOverlay
 * ------------------
 * 中央の正方形アパーチャとコーナーマーカーでデータHUD風のフレームを描画。
 */
export class DataGridHUDOverlay implements IUIOverlay {
    public name: string = 'Data Grid HUD';

    public draw(p: p5, tex: p5.Graphics | null, _midiManager: APCMiniMK2Manager, _bpmManager: BPMManager, _currentBeat: number): void {
        if (!tex) {
            return;
        }

        tex.clear();
        tex.push();
        tex.rectMode(p.CORNER);

        const width = tex.width;
        const height = tex.height;
        const minDim = Math.min(width, height);
        const apertureSize = minDim * 0.32;
        const centerX = width / 2;
        const centerY = height / 2;
        const frameThickness = Math.max(2, minDim * 0.0065);

        const halfAperture = apertureSize / 2;
        const left = centerX - halfAperture;
        const right = centerX + halfAperture;
        const top = centerY - halfAperture;
        const bottom = centerY + halfAperture;

        tex.noStroke();
        tex.fill(0, 235);
        tex.rect(0, 0, width, Math.max(0, top));
        tex.rect(0, bottom, width, Math.max(0, height - bottom));
        tex.rect(0, top, Math.max(0, left), Math.max(0, bottom - top));
        tex.rect(right, top, Math.max(0, width - right), Math.max(0, bottom - top));

        tex.rectMode(p.CENTER);

        tex.noFill();
        tex.stroke(255);
        tex.strokeWeight(frameThickness);
        tex.rect(centerX, centerY, apertureSize * 1.05, apertureSize * 1.05);

        tex.strokeWeight(frameThickness * 0.55);
        tex.rect(centerX, centerY, apertureSize * 0.72, apertureSize * 0.72);

        const markerSize = apertureSize * 0.12;
        tex.strokeWeight(frameThickness * 0.8);
        tex.line(centerX - apertureSize * 0.5, centerY - apertureSize * 0.5, centerX - apertureSize * 0.5 + markerSize, centerY - apertureSize * 0.5);
        tex.line(centerX - apertureSize * 0.5, centerY - apertureSize * 0.5, centerX - apertureSize * 0.5, centerY - apertureSize * 0.5 + markerSize);

        tex.line(centerX + apertureSize * 0.5, centerY - apertureSize * 0.5, centerX + apertureSize * 0.5 - markerSize, centerY - apertureSize * 0.5);
        tex.line(centerX + apertureSize * 0.5, centerY - apertureSize * 0.5, centerX + apertureSize * 0.5, centerY - apertureSize * 0.5 + markerSize);

        tex.line(centerX - apertureSize * 0.5, centerY + apertureSize * 0.5, centerX - apertureSize * 0.5 + markerSize, centerY + apertureSize * 0.5);
        tex.line(centerX - apertureSize * 0.5, centerY + apertureSize * 0.5, centerX - apertureSize * 0.5, centerY + apertureSize * 0.5 - markerSize);

        tex.line(centerX + apertureSize * 0.5, centerY + apertureSize * 0.5, centerX + apertureSize * 0.5 - markerSize, centerY + apertureSize * 0.5);
        tex.line(centerX + apertureSize * 0.5, centerY + apertureSize * 0.5, centerX + apertureSize * 0.5, centerY + apertureSize * 0.5 - markerSize);

        tex.rectMode(p.CORNER);
        tex.pop();
    }
}
