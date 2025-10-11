import type { IUIOverlay } from '../core/IUIOverlay';
import { UI_None } from '../ui/UI_None';
import { SideControlHUDOverlay } from '../ui/SideControlHUDOverlay';
import { SceneTabsOverlay } from '../ui/SceneTabsOverlay';
import { CameraFrameOverlay } from '../ui/CameraFrameOverlay';
import { CircularPortalOverlay } from '../ui/CircularPortalOverlay';
import { DataGridHUDOverlay } from '../ui/DataGridHUDOverlay';

export type UIOverlayConstructor = new () => IUIOverlay;

export const DEFAULT_UI_OVERLAYS: UIOverlayConstructor[] = [
  UI_None,
  SideControlHUDOverlay,
  SceneTabsOverlay,
  CameraFrameOverlay,
  CircularPortalOverlay,
  DataGridHUDOverlay,
];

export function instantiateUIOverlays(constructors: UIOverlayConstructor[] = DEFAULT_UI_OVERLAYS): IUIOverlay[] {
  return constructors.map((OverlayCtor) => new OverlayCtor());
}
