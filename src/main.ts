// src/main.ts

import p5 from 'p5';

import { APCMiniMK2Manager } from './midi/APCMiniMK2Manager';
import { BPMManager } from './rhythm/BPMManager';
import { SceneManager } from './core/SceneManager';
import type { IScene } from './core/IScene';
import { UIManager } from './core/UIManager';
import type { IUIOverlay } from './core/IUIOverlay';
import { instantiateScenes } from './config/sceneConfig';
import { instantiateUIOverlays } from './config/uiConfig';
import {
  ACTIVE_POST_EFFECTS,
  POST_EFFECT_UNIFORMS,
  resolvePostEffectValue,
} from './config/postEffectConfig';
import { Easing } from './utils/easing';

// ポストエフェクトの選択は `src/config/postEffectConfig.ts` を編集してください。

// グローバルなマネージャーインスタンスの宣言
let midiManager: APCMiniMK2Manager = new APCMiniMK2Manager();
let bpmManager: BPMManager = new BPMManager();
let sceneManager: SceneManager = new SceneManager(midiManager);
let uiManager: UIManager = new UIManager(midiManager, bpmManager);

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
    const allScenes: IScene[] = instantiateScenes();
    sceneManager.setup(p, allScenes);

    // 3. UI Managerの初期化とUIパターンの登録
    const allUIPatterns: IUIOverlay[] = instantiateUIOverlays();
    uiManager.setup(p, allUIPatterns);
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
    postShader.setUniform("u_beat", bpmManager.getBeat());
    postShader.setUniform("u_tex", sceneManager.getDrawTexture() || p.createGraphics(p.width, p.height));
    postShader.setUniform("u_uitex", uiManager.getUITexture() || p.createGraphics(p.width, p.height));

    POST_EFFECT_UNIFORMS.forEach((uniform) => {
      postShader.setUniform(uniform, 0);
    });

    ACTIVE_POST_EFFECTS.forEach((effect, index) => {
      const rawValue = midiManager.faderValues[index] ?? 0;
      const value = resolvePostEffectValue(effect, rawValue);
      postShader.setUniform(effect.uniform, value);
    });

    postShader.setUniform("u_blackout", Easing.easeInOutSine(midiManager.faderValues[8] ?? 0));
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
      p.fullscreen(true);
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