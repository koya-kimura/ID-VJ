// src/scenes/Scene8.ts

import p5 from 'p5';
import type { IScene } from "./IScene";
import { APCMiniMK2Manager } from '../midi/APCMiniMK2Manager';
import { Easing } from '../utils/easing';

type SlicePattern = "none" | "vertical" | "grid" | "frame" | "strobe";
type SequenceMode = "forward" | "reverse" | "pingpong" | "shuffle" | "strobe";
type AngleMode = "flat" | "tilt" | "alternate" | "beat";
type FadeMode = "hard" | "soft" | "slow" | "ghost";
type OverlayAlphaMode = "steady" | "beat" | "pulse" | "strobe";
type MixMode = "same" | "neighbor" | "cycle" | "random";
type FlashMode = "cut" | "soft" | "strobe" | "fade";

interface SliceSpec {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    alpha: number;
}

interface SliceOptions {
    pattern: SlicePattern;
    sliceCount: number;
    angleMode: AngleMode;
    alphaMode: OverlayAlphaMode;
    beatPhase: number;
    eased: number;
    beatIndex: number;
}

interface FlashProfile {
    current: number;
    previous: number;
}

/**
 * Scene8: Photo Pulse Collage
 * 画像を全画面で切り替えつつ、同一/別画像の切り抜きを重ねて奥行きを演出する。
 * 画像そのものの位置は大きく動かさず、スライス切替と角度変化でリズム感を添える。
 */
export class Scene8 implements IScene {
    public name: string = "Scene 8: Photo Pulse Collage";

    private readonly sequenceModes: SequenceMode[] = ["forward", "reverse", "pingpong", "shuffle", "strobe"];
    private readonly slicePatterns: SlicePattern[] = ["none", "vertical", "grid", "frame", "strobe"];
    private readonly sliceDensityOptions = [2, 4, 8, 12];
    private readonly angleModes: AngleMode[] = ["flat", "tilt", "alternate", "beat"];
    private readonly fadeModes: FadeMode[] = ["hard", "soft", "slow", "ghost"];
    private readonly overlayAlphaModes: OverlayAlphaMode[] = ["steady", "beat", "pulse", "strobe"];
    private readonly mixModes: MixMode[] = ["same", "neighbor", "cycle", "random"];
    private readonly flashModes: FlashMode[] = ["cut", "soft", "strobe", "fade"];

    private maxOptions: number[] = [
        this.sequenceModes.length,
        this.slicePatterns.length,
        this.sliceDensityOptions.length,
        this.angleModes.length,
        this.fadeModes.length,
        this.overlayAlphaModes.length,
        this.mixModes.length,
        this.flashModes.length,
    ];

    private assetsRequested = false;
    private orderedImages: p5.Image[] = [];
    private imageMap: Map<number, p5.Image> = new Map();

    public setup(apcManager: APCMiniMK2Manager, sceneIndex: number, p?: p5): void {
        apcManager.setMaxOptionsForScene(sceneIndex, this.maxOptions);
        if (p) {
            this.ensureAssets(p);
        }
    }

    public draw(p: p5, tex: p5.Graphics, _tex3d: p5.Graphics, apcManager: APCMiniMK2Manager, currentBeat: number): void {
        this.ensureAssets(p);

        const selection = new Array(8).fill(0).map((_, i) => apcManager.getParamValue(i));
        const sequenceMode = this.sequenceModes[selection[0]];
        const slicePattern = this.slicePatterns[selection[1]];
        const sliceCount = this.sliceDensityOptions[selection[2]];
        const angleMode = this.angleModes[selection[3]];
        const fadeMode = this.fadeModes[selection[4]];
        const overlayAlphaMode = this.overlayAlphaModes[selection[5]];
        const mixMode = this.mixModes[selection[6]];
        const flashMode = this.flashModes[selection[7]];

        const totalImages = this.orderedImages.length;
        if (totalImages === 0) {
            this.drawFallback(tex);
            return;
        }

        const beatPhase = (currentBeat % 1 + 1) % 1;
        const beatIndex = Math.floor(currentBeat);

        const baseIndex = this.selectImageIndex(sequenceMode, beatIndex, totalImages);
        const prevIndex = this.selectImageIndex(sequenceMode, beatIndex - 1, totalImages);
        const baseImage = this.orderedImages[baseIndex];
        const previousImage = this.orderedImages[prevIndex];

        const flashProfile = this.computeFlash(flashMode, beatPhase);
        const fadeAlpha = this.fadeAlphaValue(fadeMode);

        tex.noStroke();
        tex.fill(0, fadeAlpha);
        tex.rect(0, 0, tex.width, tex.height);

        tex.push();
        tex.translate(tex.width / 2, tex.height / 2);
        tex.imageMode(p.CENTER);

        const baseScale = this.coverScale(baseImage, tex.width, tex.height);
        const baseWidth = baseImage.width * baseScale;
        const baseHeight = baseImage.height * baseScale;

        if (flashProfile.previous > 0 && previousImage) {
            const prevScale = this.coverScale(previousImage, tex.width, tex.height);
            tex.tint(255, p.constrain(flashProfile.previous * 255, 0, 255));
            tex.image(previousImage, 0, 0, previousImage.width * prevScale, previousImage.height * prevScale);
        }

        tex.tint(255, p.constrain(flashProfile.current * 255, 0, 255));
        tex.image(baseImage, 0, 0, baseWidth, baseHeight);

        tex.noTint();

        const sliceOptions: SliceOptions = {
            pattern: slicePattern,
            sliceCount,
            angleMode,
            alphaMode: overlayAlphaMode,
            beatPhase,
            eased: this.overlayEase(overlayAlphaMode, beatPhase),
            beatIndex,
        };

        const slices = this.buildSlices(sliceOptions, tex.width, tex.height, p);
        if (slices.length > 0) {
            slices.forEach((slice, idx) => {
                const overlayIndex = this.selectOverlayImageIndex(mixMode, baseIndex, idx, totalImages, beatIndex);
                const overlayImage = this.orderedImages[overlayIndex];

                const crop = this.computeCropRect(overlayImage, slice.width, slice.height, beatIndex, idx, p);

                tex.push();
                tex.translate(slice.x - tex.width / 2, slice.y - tex.height / 2);
                tex.translate(slice.width / 2, slice.height / 2);
                tex.rotate(slice.rotation);
                tex.tint(255, p.constrain(slice.alpha * 255, 0, 255));
                tex.image(
                    overlayImage,
                    0,
                    0,
                    slice.width,
                    slice.height,
                    crop.sx,
                    crop.sy,
                    crop.sw,
                    crop.sh,
                );
                tex.pop();
            });
            tex.noTint();
        }

        tex.pop();
    }

    private ensureAssets(p: p5): void {
        if (this.assetsRequested) {
            return;
        }
        this.assetsRequested = true;

        const MAX_IMAGES = 10;
        for (let i = 1; i <= MAX_IMAGES; i++) {
            this.loadImageForIndex(p, i, 0);
        }
    }

    private loadImageForIndex(p: p5, index: number, attempt: number): void {
        const extensions = [".png", ".PNG", ".jpg", ".JPG", ".jpeg", ".JPEG"];
        if (attempt >= extensions.length) {
            return;
        }

        const path = `./image/image-${index}${extensions[attempt]}`;
        p.loadImage(path,
            (img) => {
                this.imageMap.set(index, img);
                this.refreshOrderedImages();
            },
            () => {
                this.loadImageForIndex(p, index, attempt + 1);
            });
    }

    private refreshOrderedImages(): void {
        this.orderedImages = Array.from(this.imageMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([, img]) => img);
    }

    private selectImageIndex(mode: SequenceMode, beatIndex: number, total: number): number {
        if (total === 0) {
            return 0;
        }
        const mod = (n: number, m: number) => ((n % m) + m) % m;
        const beat = total === 1 ? 0 : beatIndex;
        const pingpongLength = total * 2 - 2;

        switch (mode) {
            case "reverse":
                return mod((total - 1) - mod(beat, total), total);
            case "pingpong":
                if (pingpongLength <= 0) return 0;
                {
                    const pos = mod(beat, pingpongLength);
                    return pos < total ? pos : (pingpongLength - pos);
                }
            case "shuffle":
                return mod(Math.floor(Math.sin((beat + 1) * 137.31) * total), total);
            case "strobe":
                return beat % 2 === 0 ? 0 : mod(Math.floor(beat / 2), total);
            case "forward":
            default:
                return mod(beat, total);
        }
    }

    private computeFlash(mode: FlashMode, beatPhase: number): FlashProfile {
        const easeIn = Easing.easeInOutSine(beatPhase);
        switch (mode) {
            case "soft":
                return { current: easeIn, previous: 1 - easeIn };
            case "strobe":
                return { current: beatPhase < 0.2 ? 1 : 0.2, previous: beatPhase < 0.2 ? 0.2 : 0.9 };
            case "fade":
                return { current: Easing.easeOutCubic(beatPhase), previous: Easing.easeInCubic(1 - beatPhase) };
            case "cut":
            default:
                return { current: 1, previous: beatPhase < 0.05 ? 1 : 0 };
        }
    }

    private fadeAlphaValue(mode: FadeMode): number {
        switch (mode) {
            case "hard": return 255;
            case "soft": return 180;
            case "slow": return 110;
            case "ghost":
            default:
                return 32;
        }
    }

    private coverScale(img: p5.Image, width: number, height: number): number {
        const scale = Math.max(width / img.width, height / img.height);
        return scale;
    }

    private overlayEase(mode: OverlayAlphaMode, beatPhase: number): number {
        switch (mode) {
            case "beat": return Easing.easeOutQuad(beatPhase);
            case "pulse": return Easing.easeInOutCubic((beatPhase * 2) % 1);
            case "strobe": return beatPhase < 0.1 ? 1 : 0.2;
            case "steady":
            default:
                return 0.8;
        }
    }

    private buildSlices(options: SliceOptions, width: number, height: number, p: p5): SliceSpec[] {
        if (options.pattern === "none") {
            return [];
        }
        const slices: SliceSpec[] = [];
        const baseCount = Math.max(1, options.sliceCount);
        const randomSeed = options.beatIndex * 1337;
        p.randomSeed(randomSeed);

        const alphaBase = options.alphaMode === "steady" ? options.eased : 1;

        const createSpec = (x: number, y: number, w: number, h: number, idx: number) => {
            const rotation = this.sliceRotation(options.angleMode, idx, baseCount, options.beatIndex, p);
            const alpha = this.sliceAlpha(options.alphaMode, idx, baseCount, options.beatPhase, options.eased) * alphaBase;
            slices.push({ x, y, width: w, height: h, rotation, alpha });
        };

        switch (options.pattern) {
            case "vertical": {
                const sliceWidth = width / baseCount;
                for (let i = 0; i < baseCount; i++) {
                    const jitter = p.random(-0.08, 0.08) * sliceWidth;
                    createSpec(i * sliceWidth + jitter, 0, sliceWidth * 1.1, height, i);
                }
                break;
            }
            case "grid": {
                const cols = Math.ceil(Math.sqrt(baseCount));
                const rows = Math.ceil(baseCount / cols);
                const cellW = width / cols;
                const cellH = height / rows;
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const idx = r * cols + c;
                        if (idx >= baseCount) break;
                        const jitterX = p.random(-0.1, 0.1) * cellW;
                        const jitterY = p.random(-0.1, 0.1) * cellH;
                        createSpec(c * cellW + jitterX, r * cellH + jitterY, cellW * 1.05, cellH * 1.05, idx);
                    }
                }
                break;
            }
            case "frame": {
                const border = Math.min(width, height) * 0.12;
                createSpec(0, 0, width, border, 0);
                createSpec(0, height - border, width, border, 1);
                createSpec(0, 0, border, height, 2);
                createSpec(width - border, 0, border, height, 3);
                break;
            }
            case "strobe": {
                const bands = baseCount;
                const bandHeight = height / bands;
                for (let i = 0; i < bands; i++) {
                    if ((i + options.beatIndex) % 2 === 0) continue;
                    createSpec(0, i * bandHeight, width, bandHeight * 1.05, i);
                }
                break;
            }
        }

        return slices;
    }

    private sliceRotation(mode: AngleMode, index: number, _total: number, beatIndex: number, p: p5): number {
        switch (mode) {
            case "tilt":
                return p.radians(4);
            case "alternate":
                return (index % 2 === 0 ? 1 : -1) * p.radians(5);
            case "beat":
                return (beatIndex % 2 === 0 ? 1 : -1) * p.radians(6);
            case "flat":
            default:
                return 0;
        }
    }

    private sliceAlpha(
        mode: OverlayAlphaMode,
        index: number,
        total: number,
        beatPhase: number,
        eased: number,
    ): number {
        switch (mode) {
            case "beat":
                return Easing.easeOutQuad(beatPhase);
            case "pulse":
                return 0.5 + 0.5 * Math.sin(beatPhase * Math.PI * 2 + index * 0.5);
            case "strobe":
                return (index + Math.floor(beatPhase * total)) % 2 === 0 ? 1 : 0.2;
            case "steady":
            default:
                return eased;
        }
    }

    private selectOverlayImageIndex(mode: MixMode, baseIndex: number, sliceIndex: number, total: number, beatIndex: number): number {
        if (total === 0) return baseIndex;
        switch (mode) {
            case "neighbor":
                return (baseIndex + 1) % total;
            case "cycle":
                return (baseIndex + sliceIndex) % total;
            case "random":
                return Math.abs(Math.floor(Math.sin((beatIndex + 1) * (sliceIndex + 2) * 73.17) * total)) % total;
            case "same":
            default:
                return baseIndex;
        }
    }

    private computeCropRect(img: p5.Image, destWidth: number, destHeight: number, beatIndex: number, sliceIndex: number, p: p5): { sx: number; sy: number; sw: number; sh: number } {
        const seed = beatIndex * 911 + sliceIndex * 137;
        p.randomSeed(seed);
        const cropScale = p.random(0.35, 0.75);
        const aspect = destWidth / destHeight;
        const cropHeight = Math.min(img.height, img.height * cropScale);
        const cropWidth = Math.min(img.width, cropHeight * aspect);
        const sx = p.random(0, Math.max(1, img.width - cropWidth));
        const sy = p.random(0, Math.max(1, img.height - cropHeight));
        return { sx, sy, sw: cropWidth, sh: cropHeight };
    }

    private drawFallback(tex: p5.Graphics): void {
        tex.push();
        tex.resetMatrix();
        tex.fill(32, 180);
        tex.rect(0, 0, tex.width, tex.height);
        tex.stroke(200);
        tex.noFill();
        const margin = Math.min(tex.width, tex.height) * 0.1;
        tex.rect(margin, margin, tex.width - margin * 2, tex.height - margin * 2);
        tex.pop();
    }
}