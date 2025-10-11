// src/ui/UIManager.ts

import p5 from 'p5';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { BPMManager } from '../rhythm/BPMManager';
import type { IUIOverlay } from './IUIOverlay';
import * as P5 from 'p5';

/**
 * UIオーバーレイの切り替えと描画を管理するクラス
 */
export class UIManager {
    private uiPatterns: IUIOverlay[];
    private currentUIIndex: number = 0;
    private midiManager: APCMiniMK2Manager;
    private bpmManager: BPMManager;
    private UItexture: p5.Graphics | null = null;

    /**
     * @param midiManager APC Mini MK2 マネージャー
     * @param bpmManager BPM マネージャー
     * @param uiPatterns すべての利用可能なUIパターンの配列
     */
    constructor(midiManager: APCMiniMK2Manager, bpmManager: BPMManager) {
        this.midiManager = midiManager;
        this.bpmManager = bpmManager;
        this.uiPatterns = [];
        this.UItexture = null;
    }

    setup(p: p5, uiPatterns: IUIOverlay[]): void {
        this.uiPatterns = uiPatterns;
        this.UItexture = p.createGraphics(p.width, p.height);
    }

    /**
     * 現在のUIテクスチャを取得します。
     * @returns p5.Graphics | null 現在のUIテクスチャ
     */
    public getUITexture(): p5.Graphics | null {
        return this.UItexture;
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
     * @param currentBeat 現在のビートカウント
     */
    public draw(p: p5, currentBeat: number): void {
        if (this.currentUIIndex >= 0 && this.currentUIIndex < this.uiPatterns.length) {
            const currentUI = this.uiPatterns[this.currentUIIndex];

            // UIの描画
            currentUI.draw(p, this.UItexture, this.midiManager, this.bpmManager, currentBeat);
        }
    }

    public resize(p: p5): void {
        if (this.UItexture) {
            this.UItexture.resizeCanvas(p.width, p.height);
        }
    }
}