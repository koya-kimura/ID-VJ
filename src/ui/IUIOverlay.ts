// src/ui/IUIOverlay.ts

import p5 from 'p5';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { BPMManager } from '../rhythm/BPMManager';

/**
 * すべてのUIオーバーレイが実装すべきインターフェース
 */
export interface IUIOverlay {
    name: string;

    /**
     * オーバーレイを描画します。
     * @param p p5.js インスタンス
     * @param midiManager APC Mini MK2 マネージャー
     * @param bpmManager BPM マネージャー
     * @param tempoIndex 現在のビートカウント
     */
    draw(p: p5, midiManager: APCMiniMK2Manager, bpmManager: BPMManager, tempoIndex: number): void;
}