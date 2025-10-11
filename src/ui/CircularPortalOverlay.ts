// src/ui/CircularPortalOverlay.ts

import p5 from 'p5';
import type { IUIOverlay } from '../core/IUIOverlay';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { BPMManager } from '../rhythm/BPMManager';

/**
 * CircularPortalOverlay
 * ---------------------
 * 周囲を暗転し中央に円形ポータルを描き、アクセントティックで縁取るフレーム。
 */
export class CircularPortalOverlay implements IUIOverlay {
    public name: string = 'Circular Portal Frame';

    public draw(p: p5, tex: p5.Graphics | null, _midiManager: APCMiniMK2Manager, _bpmManager: BPMManager, _currentBeat: number): void {
        if (!tex) {
            return;
        }

        tex.clear();
        tex.push();
        tex.rectMode(p.CORNER);
        tex.ellipseMode(p.CENTER);

        const width = tex.width;
        const height = tex.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.33;
        const frameThickness = Math.max(2, radius * 0.02);

        tex.noStroke();
        tex.fill(0, 235);
        tex.rect(0, 0, width, height);

        tex.erase();
        tex.circle(centerX, centerY, radius * 2);
        tex.noErase();

        tex.noFill();
        tex.stroke(255);
        tex.strokeWeight(frameThickness);
        tex.circle(centerX, centerY, radius * 2);

        tex.strokeWeight(frameThickness * 0.35);
        const tickCount = 16;
        for (let i = 0; i < tickCount; i++) {
            const angle = (i / tickCount) * p.TWO_PI;
            const inner = radius * 0.92;
            const outer = radius * 1.05;
            const x1 = centerX + Math.cos(angle) * inner;
            const y1 = centerY + Math.sin(angle) * inner;
            const x2 = centerX + Math.cos(angle) * outer;
            const y2 = centerY + Math.sin(angle) * outer;
            tex.line(x1, y1, x2, y2);
        }

        tex.rectMode(p.CORNER);
        tex.ellipseMode(p.CENTER);
        tex.pop();
    }
}
