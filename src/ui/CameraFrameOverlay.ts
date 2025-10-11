// src/ui/CameraFrameOverlay.ts

import p5 from 'p5';
import type { IUIOverlay } from '../core/IUIOverlay';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { BPMManager } from '../rhythm/BPMManager';

/**
 * CameraFrameOverlay
 * ------------------
 * 撮影用フレームや計測線、RECインジケーターを表示するカメラHUD。
 */
export class CameraFrameOverlay implements IUIOverlay {
    public name: string = 'Camera Frame Overlay';

    public draw(p: p5, tex: p5.Graphics | null, midiManager: APCMiniMK2Manager, bpmManager: BPMManager, _currentBeat: number): void {
        if (!tex) {
            return;
        }

        tex.clear();
        tex.push();

        const width = tex.width;
        const height = tex.height;
        const margin = height * 0.07;
        const frameThickness = Math.max(2, height * 0.005);
        const cornerLength = Math.min(width, height) * 0.06;
        const safeMargin = margin * 1.45;

        tex.stroke(255);
        tex.strokeWeight(frameThickness);
        tex.noFill();
        tex.rectMode(p.CORNER);
        tex.rect(margin, margin, width - margin * 2, height - margin * 2);

        tex.strokeWeight(frameThickness * 1.4);
        const corners = [
            { x: margin, y: margin, dx: 1, dy: 1 },
            { x: width - margin, y: margin, dx: -1, dy: 1 },
            { x: width - margin, y: height - margin, dx: -1, dy: -1 },
            { x: margin, y: height - margin, dx: 1, dy: -1 },
        ];
        corners.forEach(({ x, y, dx, dy }) => {
            tex.line(x, y, x + cornerLength * dx, y);
            tex.line(x, y, x, y + cornerLength * dy);
        });

        tex.strokeWeight(frameThickness * 0.6);
        tex.rect(
            margin + safeMargin,
            margin + safeMargin,
            width - (margin + safeMargin) * 2,
            height - (margin + safeMargin) * 2,
        );

        const centerX = width / 2;
        const centerY = height / 2;
        const crossLength = Math.min(width, height) * 0.08;
        tex.strokeWeight(frameThickness * 0.7);
        tex.line(centerX - crossLength, centerY, centerX + crossLength, centerY);
        tex.line(centerX, centerY - crossLength, centerX, centerY + crossLength);
        tex.strokeWeight(frameThickness * 0.3);

        const hudY = margin * 0.6;
        const hudSpacing = width * 0.1;
        tex.textAlign(p.LEFT, p.CENTER);
        tex.fill(255);
        tex.noStroke();
        tex.textSize(height * 0.022);

        const preciseBeat = bpmManager.getBeat();
        const sceneLabel = `SCN ${midiManager.currentSceneIndex + 1}`;
        const bpmLabel = `BPM ${Math.round(bpmManager.getBPM())}`;
        const beatLabel = `BEAT ${preciseBeat.toFixed(1)}`;

        tex.text(sceneLabel, margin, hudY);
        tex.text(bpmLabel, margin + hudSpacing, hudY);
        tex.text(beatLabel, margin + hudSpacing * 2, hudY);

        const recRadius = height * 0.015;
        const beatPhase = ((preciseBeat % 1) + 1) % 1;
        const recAlpha = beatPhase < 0.5 ? 255 : 50;
        tex.fill(255, 0, 0, recAlpha);
        tex.circle(width - margin - hudSpacing * 0.4, hudY, recRadius * 2);
        tex.fill(255);
        tex.textAlign(p.RIGHT, p.CENTER);
        tex.textSize(height * 0.02);
        tex.text('LIVE', width - margin - hudSpacing * 0.6, hudY);

        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

        tex.textAlign(p.RIGHT, p.BOTTOM);
        tex.textSize(height * 0.02);
        tex.text(timestamp, width - margin, height - margin * 0.35);

        tex.pop();
    }
}
