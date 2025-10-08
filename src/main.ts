// src/main.ts

import p5 from 'p5';

import { APCMiniMK2Manager } from './midi/APCMiniMK2Manager';
import { BPMManager } from './rhythm/BPMManager';
import { SceneManager } from './scenes/SceneManager';
import { WorkingScene } from './scenes/WorkingScene';
import { Scene1 } from './scenes/Scene1';
import { Scene2 } from './scenes/Scene2';
import { Scene3 } from './scenes/Scene3';
import { Scene4 } from './scenes/Scene4';
import { Scene5 } from './scenes/Scene5';
import { Scene6 } from './scenes/Scene6';
import { Scene7 } from './scenes/Scene7';
import { Scene8 } from './scenes/Scene8';
import type { IScene } from './scenes/IScene';
import { UIManager } from './ui/UIManager';
import type { IUIOverlay } from './ui/IUIOverlay';
import { UI_None } from './ui/UI_None';
import { UI_Pattern1 } from './ui/UI_Pattern1';

// グローバルなマネージャーインスタンスの宣言
let midiManager: APCMiniMK2Manager = new APCMiniMK2Manager();
let bpmManager: BPMManager = new BPMManager();
let sceneManager: SceneManager = new SceneManager(midiManager);
let uiManager: UIManager = new UIManager(midiManager, bpmManager);

// BPMの初期値
let initialBPM = 120;

// フォント
let postShader: p5.Shader;
let font: p5.Font;

const sketch = (p: p5) => {
  /**
   * スケッチの初期設定 (p5.js setup)
   */
  p.setup = async () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);

    font = await p.loadFont('./assets/HindMadurai-Regular.ttf');
    postShader = await p.loadShader('./shader/post.vert', './shader/post.frag');

    p.noCursor();
    p.textFont(font);

    // 2. VJシーンの登録とSceneManagerの初期化
    const allScenes: IScene[] = [
      new WorkingScene(),
      new Scene2(),
      new Scene3(),
      new Scene4(),
      new Scene5(),
      new Scene6(),
      new Scene7(),
      new Scene8(),
    ];
    sceneManager.setup(p, allScenes);

    // 3. UI Managerの初期化とUIパターンの登録
    const allUIPatterns: IUIOverlay[] = [
      new UI_None(),      // 0: UIなし (オーバーレイ非表示)
      new UI_Pattern1(),  // 1: APC/BPMデバッグ情報
      new UI_None(),      // 2: 仮のUIパターン
      new UI_None(),      // 3: 仮のUIパターン
    ];
    uiManager.setup(p,allUIPatterns);
  }

  /**
   * メインの描画ループ (p5.js draw)
   */
  p.draw = () => {
    // BPMの更新とビートカウントのインクリメント
    if (bpmManager) {
      bpmManager.update();
    }

    // MIDI Managerの更新 (ランダム値計算とLED出力)
    if (midiManager) {
      midiManager.update(p.floor(bpmManager.getBeat()));
    }

    // Scene ManagerによるVJシーンの描画
    if (sceneManager) {
      sceneManager.updateAndDraw(p, bpmManager.getBeat());
    }

    // UI Managerによるオーバーレイ描画
    if (uiManager) {
      uiManager.draw(p, p.floor(bpmManager.getBeat()));
    }

    p.shader(postShader);
    postShader.setUniform("u_time", p.millis() / 1000.0);
    postShader.setUniform("u_tex", sceneManager.getDrawTexture() || p.createGraphics(p.width, p.height));
    postShader.setUniform("u_uitex", uiManager.getUITexture() || p.createGraphics(p.width, p.height));
    postShader.setUniform("u_invert", midiManager.faderValues[0]);
    postShader.setUniform("u_mosaic", midiManager.faderValues[1]);
    postShader.setUniform("u_noise", midiManager.faderValues[2]);
    postShader.setUniform("u_tile", midiManager.faderValues[3]);
    postShader.setUniform("u_cut", midiManager.faderValues[4]);
    postShader.setUniform("u_color", midiManager.faderValues[7]);
    p.rect(0, 0, p.width, p.height);
  }

  /**
   * ウィンドウサイズ変更時の処理
   */
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    sceneManager.resize(p);
    uiManager.resize(p);
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