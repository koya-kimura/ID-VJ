import p5 from 'p5';
import type { IScene } from '../src/core/IScene';
import { APCMiniMK2Manager } from '../src/midi/APCMiniMK2Manager';

/**
 * __CLASS_NAME__
 * ----------------------
 * シンプルなサンプルシーン。必要に応じてパラメーターや描画ロジックを拡張してください。
 */
export class __CLASS_NAME__ implements IScene {
  public name: string = '__DISPLAY_NAME__';

  private readonly maxOptions: number[] = [8, 8, 6, 6, 5, 5, 4, 4];
  private sceneIndex = 0;

  public setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void {
    this.sceneIndex = sceneIndex;
    apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
  }

  public draw(
    p: p5,
    tex: p5.Graphics,
    _tex3d: p5.Graphics,
    apcManager: APCMiniMK2Manager,
    currentBeat: number,
  ): void {
    tex.clear();
    tex.push();
    tex.translate(tex.width / 2, tex.height / 2);
    tex.rectMode(p.CENTER);

    const paramValues = this.maxOptions.map((max, index) => {
      const raw = apcManager.getParamValue(index);
      return max <= 1 ? 0 : p.constrain(raw / (max - 1), 0, 1);
    });

    const circleCount = Math.max(1, Math.round(paramValues[0] * 7) + 1);
    const orbitRadius = tex.height * (0.15 + paramValues[1] * 0.45);
    const baseSize = tex.height * (0.08 + paramValues[2] * 0.15);
    const wobbleStrength = 0.2 + paramValues[3] * 0.8;
    const hueShift = paramValues[4];
    const tailAlpha = 0.2 + paramValues[5] * 0.6;
    const rotationDir = paramValues[6] < 0.5 ? -1 : 1;
    const strokeMode = paramValues[7] > 0.5;

    tex.colorMode(p.HSB, 360, 100, 100, 1);

    tex.noStroke();
    tex.fill(0, 0, 0, tailAlpha * 0.6);
    tex.rect(0, 0, tex.width, tex.height);

    for (let i = 0; i < circleCount; i++) {
      const progress = i / circleCount;
      const angle = rotationDir * (currentBeat * 0.8 + progress * p.TWO_PI);
      const wobble = Math.sin((currentBeat + progress) * p.TWO_PI) * wobbleStrength;
      const radius = orbitRadius * (0.7 + wobble * 0.3);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const size = baseSize * (0.6 + wobble * 0.4);
      const hue = (progress * 360 + hueShift * 360) % 360;

      if (strokeMode) {
        tex.stroke(hue, 90, 100, 0.9);
        tex.strokeWeight(3);
        tex.noFill();
      } else {
        tex.noStroke();
        tex.fill(hue, 70, 100, 0.9);
      }

      tex.push();
      tex.translate(x, y);
      tex.rotate(angle * 0.25);
      tex.ellipse(0, 0, size * 0.9, size * (1.1 + wobble * 0.3));
      tex.pop();
    }

    tex.pop();
  }

  public resize(_p: p5): void {
    // 必要に応じてリサイズ処理を実装してください。
  }

  public destroy(): void {
    // 後処理が必要な場合はここに記述します。
  }
}
