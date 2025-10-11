import type { IScene } from '../core/IScene';
import { OrbitalPatternFieldScene } from '../scenes/OrbitalPatternFieldScene';
import { LinearFlowGridScene } from '../scenes/LinearFlowGridScene';
import { GlyphCascadeScene } from '../scenes/GlyphCascadeScene';
import { RadialBloomScene } from '../scenes/RadialBloomScene';
import { FallingSphereArrayScene } from '../scenes/FallingSphereArrayScene';
import { RadialPulseConduitsScene } from '../scenes/RadialPulseConduitsScene';
import { BinaryParticleLoomScene } from '../scenes/BinaryParticleLoomScene';
import { PhotoPulseCollageScene } from '../scenes/PhotoPulseCollageScene';

export type SceneConstructor = new () => IScene;

export const DEFAULT_SCENE_LIBRARY: SceneConstructor[] = [
  OrbitalPatternFieldScene,
  LinearFlowGridScene,
  GlyphCascadeScene,
  RadialBloomScene,
  FallingSphereArrayScene,
  RadialPulseConduitsScene,
  BinaryParticleLoomScene,
  PhotoPulseCollageScene,
];

export function instantiateScenes(sceneConstructors: SceneConstructor[] = DEFAULT_SCENE_LIBRARY): IScene[] {
  return sceneConstructors.map((SceneCtor) => new SceneCtor());
}
