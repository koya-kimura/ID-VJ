// src/scenes/IScene.ts

import p5 from 'p5';
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';

/**
 * すべてのシーンクラスが実装すべきインターフェース
 */
export interface IScene {
    /** シーンの名前 */
    name: string;

    /**
     * シーンがアクティブ化されたときに一度だけ呼び出されます。
     */
    setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void;

    /**
     * 毎フレームの描画処理。
     * 💡 修正: tempoIndex を追加
     * @param p p5.js インスタンス
     * @param apcManager APC Mini MK2のマネージャーインスタンス
     * @param tempoIndex BPMManager から取得した現在のビートカウント
     */
    draw(p: p5, apcManager: APCMiniMK2Manager, tempoIndex: number): void;
}