// src/ui/UIManager.ts

import p5 from 'p5';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { BPMManager } from '../rhythm/BPMManager';
import type { IUIOverlay } from './IUIOverlay';

/**
 * UIオーバーレイの切り替えと描画を管理するクラス
 */
export class UIManager {
    private uiPatterns: IUIOverlay[];
    private currentUIIndex: number = 0;
    private midiManager: APCMiniMK2Manager;
    private bpmManager: BPMManager;

    /**
     * @param midiManager APC Mini MK2 マネージャー
     * @param bpmManager BPM マネージャー
     * @param uiPatterns すべての利用可能なUIパターンの配列
     */
    constructor(midiManager: APCMiniMK2Manager, bpmManager: BPMManager, uiPatterns: IUIOverlay[]) {
        this.midiManager = midiManager;
        this.bpmManager = bpmManager;
        this.uiPatterns = uiPatterns;
    }

    /**
     * キー入力や外部イベントに基づいてUIパターンを切り替えます。
     * @param index 選択するUIパターンの配列インデックス
     */
    public selectUI(index: number): void {
        if (index >= 0 && index < this.uiPatterns.length) {
            this.currentUIIndex = index;
            console.log(`UI Switched to: ${this.uiPatterns[index].name}`);
        } else if (index === 0) {
            // 0インデックスは常に「UIなし」に対応させる
            this.currentUIIndex = 0;
            console.log("UI Switched to: None");
        }
    }

    /**
     * 現在選択されているUIパターンを描画します。
     * @param p p5.js インスタンス
     * @param tempoIndex 現在のビートカウント
     */
    public draw(p: p5, tempoIndex: number): void {
        if (this.currentUIIndex >= 0 && this.currentUIIndex < this.uiPatterns.length) {
            const currentUI = this.uiPatterns[this.currentUIIndex];

            // UIの描画
            currentUI.draw(p, this.midiManager, this.bpmManager, tempoIndex);
        }
    }
}