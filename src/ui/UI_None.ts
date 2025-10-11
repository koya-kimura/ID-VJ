// src/ui/UI_None.ts

import p5 from 'p5';
import type { IUIOverlay } from '../core/IUIOverlay';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { BPMManager } from '../rhythm/BPMManager';

/**
 * UIなし。描画オーバーレイをクリアするために使用。
 */
export class UI_None implements IUIOverlay {
    public name: string = "None";

    public draw(p: p5, tex: p5.Graphics, midiManager: APCMiniMK2Manager, bpmManager: BPMManager, tempoIndex: number): void {
        tex.clear(); // 何も描画しない
    }
}