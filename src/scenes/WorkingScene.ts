// src/scenes/WorkingScene.ts

import p5 from 'p5';
import type { IScene } from "./IScene";
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { Easing } from '../utils/easing';

/**
 * Working Scene: 3D Object Field
 * 3D空間の箱群をカメラ、パターン、回転で制御する複雑なシーン。
 */
export class WorkingScene implements IScene {
    public name: string = "Working Scene: 3D Object Field";

    // --- APC Mini MK2 maxOptions (変更なし) ---
    // P0: Density, P1: Rotate Mode, P2: Camera, P3: Object Pattern, P4: Box Scale, P5: Radius Scale, P6: Render Mode, P7: Scale Animation
    private maxOptions: number[] = [4, 7, 4, 4, 4, 4, 4, 4];

    public setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void {
        apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
    }

    /**
     * 描画処理
     */
    public draw(p: p5, tex: p5.Graphics, tex3d: p5.Graphics, apcManager: APCMiniMK2Manager, currentBeat: number): void {

        // 1. パラメーターの取得と値の変換
        const getParamValue = apcManager.getParamValue.bind(apcManager);

        const vertexNum = p.pow(2, getParamValue(0) + 1) + 1;
        const shapeNum = p.pow(2, getParamValue(1));
        const shapePattern = ["circle", "star"][getParamValue(2) % 2];
        const positionPattern = ["center", "random"][getParamValue(3) % 2];
        const shapeNoiseScale = getParamValue(4) / this.maxOptions[4];
        const strokeWeightType = ["thin", "thick", "random"][getParamValue(5) % 3];
        const fillStyle = ["none", "fill", "fillAlpha", "rand"][getParamValue(6) % 4];
        const motionType = ["none", "bound", "translate"][getParamValue(7) % 3];

        p.push();
        p.randomSeed(p.noise(p.floor(currentBeat / 2)*371901)*8979371);

        tex.push();

        tex.translate(tex.width / 2, tex.height / 2);

        const baseRadius = p.min(tex.width, tex.height) * 0.4;

        for (let j = 0; j < shapeNum; j++) {
            const radius = baseRadius * p.map(j / shapeNum, 0, 1, 0.1, 1.0);
            const sw = (strokeWeightType == "thick" ? 0.03 : strokeWeightType == "thin" ? 0.005 : p.random(0.005, 0.03)) * p.min(tex.width, tex.height);

            let x = 0;
            let y = 0;
            let a = 0;
            if (positionPattern === "random") {
                x = p.random(-tex.width / 2, tex.width / 2);
                y = p.random(-tex.height / 2, tex.height / 2);
                a = p.random(p.TWO_PI);
            }

            tex.push();

            const st = fillStyle === "rand" ? (["none", "fill", "fillAlpha"][p.floor(p.random(3))]) : fillStyle;
            if (st === "fill") {
                tex.fill(255);
                tex.noStroke();
            } else if (st === "fillAlpha") {
                tex.fill(255, Easing.easeOutCubic(p.abs((currentBeat + 1) % 2 - 1)) * 255);
                tex.noStroke();
            } else {
                tex.stroke(255);
                tex.noFill();
            }
            tex.strokeWeight(sw);
            tex.translate(x, y);
            tex.rotate(a);
            if (motionType === "bound") {
            tex.scale(p.map(Easing.easeOutCubic(p.abs((currentBeat + 1) % 2 - 1)), 0, 1, 0.5, 1.5), p.map(Easing.easeOutCubic(p.abs((currentBeat + 1) % 2 - 1)), 0, 1, 1, 0.8));
            } else if (motionType === "translate") {
                tex.translate(p.map(Easing.easeInOutCubic(p.abs((currentBeat + 1) % 2 - 1)), 0, 1, 0, p.random(-0.5, 0.5) * p.min(tex.width, tex.height)), 0);
                tex.scale(p.map(Easing.easeOutCubic(p.abs((currentBeat) % 1 - 0.5)*2), 0, 1, 0.5, 1.5), p.map(Easing.easeOutCubic(p.abs((currentBeat) % 1 - 0.5)*2), 0, 1, 1, 0.8));
            }
            tex.beginShape();
            for (let i = 0; i < vertexNum; i++) {
                const index = shapePattern == "circle" ? i : (i * 2) % vertexNum;
                const angle = p.TWO_PI / vertexNum * index + p.random(-0.1, 0.1) * p.TWO_PI / vertexNum;
                const x = p.cos(angle) * (radius + p.random(-0.5, 0.5) * shapeNoiseScale);
                const y = p.sin(angle) * (radius + p.random(-0.5, 0.5) * shapeNoiseScale);
                tex.vertex(x, y);
            }
            tex.endShape(p.CLOSE);
            tex.pop();
        }

        tex.pop();
        p.pop();
    }
}