// src/ui/SceneTabsOverlay.ts

import p5 from 'p5';
import type { IUIOverlay } from '../core/IUIOverlay';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { BPMManager } from '../rhythm/BPMManager';

/**
 * SceneTabsOverlay
 * ----------------
 * 画面上部にシーンタブを表示し、選択中シーンを強調するHUD。
 */
export class SceneTabsOverlay implements IUIOverlay {
    public name: string = 'Scene Tabs Overlay';

    public draw(p: p5, tex: p5.Graphics | null, midiManager: APCMiniMK2Manager, _bpmManager: BPMManager, _currentBeat: number): void {
        if (!tex) {
            return;
        }

        const width = tex.width;
        const height = tex.height;
        const topBarHeight = height * 0.04;
        const borderWeight = Math.max(1, height * 0.004);

        tex.clear();
        tex.push();

        tex.noStroke();
        tex.fill(0);
        tex.rect(0, 0, width, topBarHeight);

        tex.noFill();
        tex.stroke(255);
        tex.strokeWeight(borderWeight);
        tex.rect(0, topBarHeight, width, height - topBarHeight);

        tex.rectMode(p.CORNER);

        const sceneCount = Math.min(8, midiManager.gridRadioState.length);
        const selectedIndex = midiManager.currentSceneIndex % sceneCount;
        const tabWidth = width / sceneCount;
        const tabHeight = topBarHeight * 0.9;
        const tabYOffset = topBarHeight * 0.05;

        tex.textAlign(p.CENTER, p.CENTER);

        for (let i = 0; i < sceneCount; i++) {
            const baseX = i * tabWidth;
            const isSelected = i === selectedIndex;

            tex.push();
            tex.translate(baseX, 0);

            const topInset = tabWidth * 0.08;
            const topY = tabYOffset;
            const bottomY = tabYOffset + tabHeight;

            tex.stroke(255);
            tex.strokeWeight(borderWeight * (isSelected ? 1.4 : 1));
            tex.fill(isSelected ? 255 : 0);
            tex.beginShape();
            tex.vertex(tabWidth * 0.05, bottomY);
            tex.vertex(tabWidth * 0.95, bottomY);
            tex.vertex(tabWidth - topInset, topY);
            tex.vertex(topInset, topY);
            tex.endShape(p.CLOSE);

            tex.noStroke();
            tex.textFont('Helvetica');
            tex.fill(isSelected ? 0 : 255);
            tex.textSize(tabHeight * 0.5);
            tex.text(`S00${i + 1}`, tabWidth * 0.5, topY + (bottomY - topY) * 0.5);

            if (isSelected) {
                tex.stroke(255);
                tex.strokeWeight(borderWeight * 1.5);
                tex.line(0, bottomY, tabWidth, bottomY);
            }

            tex.pop();
        }

        const scrollBarWidth = Math.max(width * 0.008, borderWeight * 3);
        const scrollBarHeight = Math.max(height * 0.18, topBarHeight * 2.5);
        const scrollBarX = width - scrollBarWidth - borderWeight * 1.5;
        const scrollBarY = topBarHeight + (height - topBarHeight - scrollBarHeight) / 2;

        tex.noStroke();
        tex.fill(255);
        tex.rect(scrollBarX, scrollBarY + scrollBarHeight * 0.15, scrollBarWidth, scrollBarHeight * 0.7, scrollBarWidth * 0.3);

        tex.pop();
    }
}
