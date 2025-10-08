// src/scenes/WorkingScene.ts

import p5 from 'p5';
import type { IScene } from "./IScene";
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { Easing } from '../utils/easing';

/**
 * Working Scene: 3D Object Field
 * 3D空間の箱群をカメラ、パターン、回転で制御する複雑なシーン。
 */
export class Scene4 implements IScene {
    public name: string = "Working Scene: 3D Object Field";

    // --- APC Mini MK2 maxOptions (変更なし) ---
    // P0: Density, P1: Rotate Mode, P2: Camera, P3: Object Pattern, P4: Box Scale, P5: Radius Scale, P6: Render Mode, P7: Scale Animation
    private maxOptions: number[] = [4, 8, 4, 4, 4, 4, 2, 2];

    public setup(apcManager: APCMiniMK2Manager, sceneIndex: number): void {
        apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
    }

    /**
     * 描画処理
     */
    public draw(p: p5, tex: p5.Graphics, tex3d: p5.Graphics, apcManager: APCMiniMK2Manager, currentBeat: number): void {

        // 1. パラメーターの取得と値の変換
        const getParamValue = apcManager.getParamValue.bind(apcManager);

        // P0: ボックスの密度
        const boxNum = p.pow(2, getParamValue(0)) * 10;

        // P1: 箱の回転モード
        const boxRotateMode = ["None", "rotateX", "rotateY", "rotateZ", "rotateXY", "rotateXZ", "rotateYZ"][getParamValue(1) % 8];

        // P2: カメラパターン
        const cameraPattern = ["front", "rotateZoomOut", "rotateZoomIn"][getParamValue(2) % 3];

        // P3: オブジェクトパターン
        const objPatternNum = getParamValue(3);

        // P4: 箱の基本スケール
        const boxScl = getParamValue(4) / this.maxOptions[4] * 5.0 + 0.5;

        // P5: フィールドの半径スケール
        const radiusScl = getParamValue(5) / this.maxOptions[5] * 2.0 + 0.1;

        // P6: 描画モード ("2d" or "3d")
        const renderMode = ["2d", "3d"][getParamValue(6) % 2];

        // P7: スケールアニメーション ("none" or "randomScale")
        const scaleMode = ["none", "randomScale"][getParamValue(7) % 2];


        // 2. 描画コンテキストの開始 (tex3d -> tex)
        tex.push();

        tex3d.push();

        p.randomSeed(p.noise(p.floor(currentBeat) * 417809) * 9890143);
        tex3d.background(0);

        // 3D空間のセットアップ
        tex3d.translate(0, 0, p.min(tex3d.width, tex3d.height) * 0.5 / p.tan(p.PI / 6));

        // 3. カメラの計算と適用
        let camX = 0;
        let camY = 0;
        let camZ = 0;
        let camAngleX = 0;
        let camAngleY = 0;
        let camAngleZ = 0;
        const CAM_ROT_SPEED = currentBeat * 0.5;

        switch (cameraPattern) {
            case "front":
                camZ = -500;
                break;
            case "rotateZoomOut":
                camY = p.sin(CAM_ROT_SPEED) * 200;
                camZ = -1000;
                camAngleX = p.map(camY, -200, 200, p.PI / 6, -p.PI / 6);
                camAngleY = CAM_ROT_SPEED - p.PI / 2;
                break;
            case "rotateZoomIn":
                camY = p.sin(CAM_ROT_SPEED) * 200;
                camZ = -100;
                camAngleX = p.map(camY, -200, 200, p.PI / 6, -p.PI / 6);
                camAngleY = CAM_ROT_SPEED - p.PI / 2;
                break;
        }

        tex3d.translate(camX, camY, camZ);
        tex3d.rotateX(camAngleX);
        tex3d.rotateY(camAngleY);
        tex3d.rotateZ(camAngleZ);


        // 4. オブジェクト描画ループ

        const radius = p.min(tex3d.width, tex3d.height) * 0.5 * radiusScl;
        const boxSizeBase = (radius * 0.5) / boxNum;

        for (let i = 0; i < boxNum; i++) {

            // 4-A. 座標計算 (P3: オブジェクトパターン)
            let x = 0;
            let y = 0;
            let z = 0;
            const angle = p.map(i, 0, boxNum, 0, p.TAU) + currentBeat * 0.1;

            switch (objPatternNum) {
                case 0: // Circle/Helix Pattern
                    x = p.cos(angle) * radius;
                    y = p.sin(angle) * radius;
                    z = p.sin(angle) * radius * 0.5;
                    break;
                case 1: // Lissajous/Complex Wave 1
                    x = p.sin(angle * 1.45) * radius;
                    y = p.sin(angle * 1.81) * radius * 0.5;
                    z = p.sin(angle * 1.12) * radius * 0.3;
                    break;
                case 2: // Lissajous/Complex Wave 2 (Phase Shifted)
                    x = p.sin(angle * 1.45 + 0.34179) * radius * 1.3;
                    y = p.sin(angle * 1.10 + 1.30981) * radius * 0.5;
                    z = p.sin(angle * 1.81 + 0.49814) * radius * 0.3;
                    break;
                case 3: // Random Scatter
                    x = p.random(-1, 1) * radius;
                    y = p.random(-1, 1) * radius;
                    z = p.random(-1, 1) * radius;
                    break;
            }

            // 4-B. アニメーションスケールの計算 (P7: ランダムスケール)
            const isFlick = (p.random() < 0.1 && scaleMode === "randomScale");
            const sclX = isFlick ? Easing.easeOutQuad(p.fract(currentBeat)) + 1.0 : 1.0;
            const size = boxSizeBase * boxScl;


            // 4-C. 箱の描画と回転 (P1: Box Rotate Mode)
            tex3d.push();
            tex3d.translate(x, y, z);

            switch (boxRotateMode) {
                case "rotateX": tex3d.rotateX(currentBeat); break;
                case "rotateY": tex3d.rotateY(currentBeat); break;
                case "rotateZ": tex3d.rotateZ(currentBeat); break;
                case "rotateXY": tex3d.rotateX(currentBeat); tex3d.rotateY(currentBeat); break;
                case "rotateXZ": tex3d.rotateX(currentBeat); tex3d.rotateZ(currentBeat); break;
                case "rotateYZ": tex3d.rotateY(currentBeat); tex3d.rotateZ(currentBeat); break;
                case "None": break;
            }

            // 描画スタイル設定 (モノクローム)
            tex3d.noFill();
            tex3d.stroke(255);

            // 描画モード (P6: 2D/3D) とアニメーションスケールの適用
            if (renderMode === "2d") {
                tex3d.scale(sclX, 1, 0);
            } else {
                tex3d.scale(sclX, 1, 1);
            }

            // 実際の描画
            tex3d.box(size);
            tex3d.pop();
        }

        // 5. 描画コンテキストの終了とテクスチャ合成
        tex3d.pop();

        // 3D描画結果を2D中間テクスチャ (tex) に貼り付け
        tex.image(tex3d, 0, 0, tex.width, tex.height);

        // 最終コンテキストのリセット
        tex.pop();
    }
}