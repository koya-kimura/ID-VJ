// src/scenes/SceneManager.ts

import { APCMiniMK2Manager } from "../midi/APCMiniMK2Manager";
import type { IScene } from "./IScene"; // VJシーンインターフェース
import p5 from 'p5';

/**
 * 複数のVJシーンを管理し、APC Mini MK2の入力に基づいてシーンの切り替えと実行を担当するクラス。
 * (VJアプリケーションにおけるステートマシンの役割)
 */
export class SceneManager {
    private scenes: IScene[];
    private currentSceneIndex: number = -1;
    private currentScene: IScene | null = null;
    private apcManager: APCMiniMK2Manager; // APCコントローラーへのアクセス

    /**
     * SceneManagerを初期化し、最初のシーンをロードします。
     * @param apcManager APC Mini MK2のマネージャーインスタンス
     * @param scenes VJプロジェクトで利用するすべてのシーンの配列
     */
    constructor(apcManager: APCMiniMK2Manager, scenes: IScene[]) {
        this.apcManager = apcManager;
        this.scenes = scenes;

        // 最初のシーン (インデックス 0) をロード
        if (this.scenes.length > 0) {
            this.switchScene(0);
        }
    }

    /**
     * メインループから呼び出され、シーンの切り替えチェックと現在のシーンの描画を実行します。
     * @param p p5.js インスタンス
     * @param tempoIndex BPMManager から取得した現在のビートカウント
     */
    public updateAndDraw(p: p5, tempoIndex: number): void {
        const targetSceneIndex = this.apcManager.currentSceneIndex;

        // APCのサイドボタン選択に基づき、シーン切り替えが必要かチェック
        if (targetSceneIndex !== this.currentSceneIndex && targetSceneIndex < this.scenes.length) {
            this.switchScene(targetSceneIndex);
        }

        // 現在アクティブなシーンの描画ロジックを実行
        if (this.currentScene) {
            // シーン描画にp5インスタンス、APC Manager、BPMテンポインデックスを渡す
            this.currentScene.draw(p, this.apcManager, tempoIndex);
        } else {
            // フォールバック: シーンが見つからないエラー表示
            p.background(0);
            p.fill(255, 0, 0);
            p.textSize(32);
            p.text("NO SCENE LOADED", p.width / 2, p.height / 2);
        }
    }

    /**
     * 指定されたインデックスのシーンに切り替えます。
     * @param index 切り替えるシーンの配列インデックス (0-7)
     */
    private switchScene(index: number): void {
        const newScene = this.scenes[index];

        if (newScene) {
            console.log(`Switching scene from ${this.currentScene ? this.currentScene.name : 'None'} to ${newScene.name} (Index: ${index})`);

            // 重要な処理: APC Managerの全パラメーターをデフォルト(maxOptions=1)にリセット
            this.apcManager.resetAllMaxOptions();

            this.currentScene = newScene;
            this.currentSceneIndex = index;

            // 新しいシーンの初期設定 (maxOptionsの設定など) を実行
            newScene.setup(this.apcManager, this.currentSceneIndex);
        }
    }

    /**
     * 現在アクティブなシーンの名前を返します。（デバッグ用）
     */
    public getCurrentSceneName(): string {
        return this.currentScene ? this.currentScene.name : "N/A";
    }
}