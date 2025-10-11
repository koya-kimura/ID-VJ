import p5 from 'p5';
import type { IUIOverlay } from '../src/core/IUIOverlay';
import { APCMiniMK2Manager } from '../src/midi/APCMiniMK2Manager';
import { BPMManager } from '../src/rhythm/BPMManager';

/**
 * __CLASS_NAME__
 * ----------------------
 * シンプルなサンプルUIオーバーレイ。必要に応じて描画内容を拡張してください。
 */
export class __CLASS_NAME__ implements IUIOverlay {
  public name: string = '__DISPLAY_NAME__';

  public draw(
    p: p5,
    tex: p5.Graphics | null,
    midiManager: APCMiniMK2Manager,
    bpmManager: BPMManager,
    currentBeat: number,
  ): void {
    const target = tex ?? p;
    target.push();
    target.noStroke();
    target.fill(255, 200);
    target.textAlign(p.RIGHT, p.BOTTOM);
    target.textSize(Math.min(target.width, target.height) * 0.04);
    const beatText = `Beat: ${currentBeat.toFixed(2)}`;
    const bpmText = `BPM: ${bpmManager.getBPM().toFixed(1)}`;
    target.text(`${this.name}\n${beatText}\n${bpmText}`, target.width - 20, target.height - 20);
    target.pop();
  }
}
