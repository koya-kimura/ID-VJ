// src/main.ts

import p5 from 'p5';
import { APCMiniMK2Manager } from './midi/APCMiniMK2Manager';
import { BPMManager } from './rhythm/BPMManager';
import { SceneManager } from './scenes/SceneManager';
import { Scene1 } from './scenes/Scene1';
import type { IScene } from './scenes/IScene';
import { UIManager } from './ui/UIManager';
import type { IUIOverlay } from './ui/IUIOverlay';
import { UI_None } from './ui/UI_None';
import { UI_Pattern1 } from './ui/UI_Pattern1';

// グローバルなマネージャーインスタンスの宣言
let midiManager: APCMiniMK2Manager;
let bpmManager: BPMManager;
let sceneManager: SceneManager;
let uiManager: UIManager;

// BPMに同期したビートカウントインデックス
let tempoIndex = 0;
let initialBPM = 120;

// フォント
let font: p5.Font;

const sketch = (p: p5) => {

  /**
   * スケッチの初期設定 (p5.js setup)
   */
  p.setup = async () => {
    font = await p.loadFont('../assets/HindMadurai-Regular.ttf');

    p.createCanvas(p.windowWidth, p.windowHeight);
    p.noCursor();
    p.textFont(font);

    // 1. MIDI/BPMマネージャーの初期化
    midiManager = new APCMiniMK2Manager();
    bpmManager = new BPMManager(initialBPM);

    // 2. VJシーンの登録とSceneManagerの初期化
    const allScenes: IScene[] = [
      new Scene1(), // Scene 0 (サイドボタン1)
      new Scene1(), // Scene 1 (以降、Scene 7まで続く)
      new Scene1(),
      new Scene1(),
      new Scene1(),
      new Scene1(),
      new Scene1(),
      new Scene1(),
    ];
    sceneManager = new SceneManager(midiManager, allScenes);

    // 3. UI Managerの初期化とUIパターンの登録
    const allUIPatterns: IUIOverlay[] = [
      new UI_None(),      // 0: UIなし (オーバーレイ非表示)
      new UI_Pattern1(),  // 1: APC/BPMデバッグ情報
      new UI_None(),      // 2: 仮のUIパターン
      new UI_None(),      // 3: 仮のUIパターン
    ];
    uiManager = new UIManager(midiManager, bpmManager, allUIPatterns);
  }

  /**
   * メインの描画ループ (p5.js draw)
   */
  p.draw = () => {
    // BPMの更新とビートカウントのインクリメント
    if (bpmManager) {
      bpmManager.update();
      if (bpmManager.isBeatUpdatedNow()) {
        tempoIndex++;
      }
    }

    // MIDI Managerの更新 (ランダム値計算とLED出力)
    if (midiManager) {
      midiManager.update(tempoIndex);
    }

    // Scene ManagerによるVJシーンの描画
    if (sceneManager) {
      sceneManager.updateAndDraw(p, tempoIndex);
    }

    // UI Managerによるオーバーレイ描画
    if (uiManager) {
      uiManager.draw(p, tempoIndex);
    }
  }

  /**
   * ウィンドウサイズ変更時の処理
   */
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  }

  /**
   * キーボード入力時の処理
   */
  p.keyPressed = () => {
    // スペースキーでフルスクリーン切り替え
    if (p.keyCode === 32) {
      p.fullscreen(!p.fullscreen());
    }
    // エンターキーでタップテンポ
    else if (p.keyCode === 13) {
      if (bpmManager) {
        bpmManager.tapTempo();
      }
    }

    // UI切り替えロジック (0-9キーに対応)
    const key = p.key.toLowerCase();
    const uiIndex = parseInt(key);

    if (!isNaN(uiIndex) && uiManager) {
      uiManager.selectUI(uiIndex);
    }
  }
}

// p5.jsスケッチを実行
new p5(sketch);