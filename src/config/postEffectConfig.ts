import { Easing } from '../utils/easing';

type TransformFn = (value: number) => number;

export type PostEffectDefinition = {
  key: string;
  label: string;
  uniform: string;
  transform?: TransformFn;
};

export type PostEffectSelectionPlan = {
  /** 優先的にフェーダーへ割り当てたいポストエフェクトのキー配列 */
  primary: string[];
  /** primaryが8個未満の場合に補完として利用する候補リスト */
  fallback?: string[];
};

type PostEffectSelectionInput = string[] | PostEffectSelectionPlan;

export const POST_EFFECT_POOL: PostEffectDefinition[] = [
  {
    key: 'invert',
    label: 'Invert Toggle',
    uniform: 'u_invert',
    transform: (value) => (Easing.easeInOutSine(value) > 0.55 ? 1 : 0),
  },
  {
    key: 'mosaic',
    label: 'Mosaic Shatter',
    uniform: 'u_mosaic',
    transform: (value) => Easing.easeInOutSine(value),
  },
  {
    key: 'noise',
    label: 'Noise Distortion',
    uniform: 'u_noise',
    transform: (value) => Easing.easeInOutSine(value),
  },
  {
    key: 'tile',
    label: 'Tile Repeat',
    uniform: 'u_tile',
    transform: (value) => Easing.easeInOutSine(value),
  },
  {
    key: 'cutGlitch',
    label: 'Cut Glitch',
    uniform: 'u_cut',
    transform: (value) => Easing.easeInOutSine(value),
  },
  {
    key: 'monochrome',
    label: 'Monochrome Mix',
    uniform: 'u_monochrome',
    transform: (value) => Easing.easeInOutSine(value),
  },
  {
    key: 'colorize',
    label: 'Palette Lock',
    uniform: 'u_color',
    transform: (value) => Easing.easeInOutSine(value),
  },
  {
    key: 'wave',
    label: 'Wave Warp',
    uniform: 'u_wave',
    transform: (value) => Easing.easeInOutSine(value),
  },
  {
    key: 'vignette',
    label: 'Vignette Fade',
    uniform: 'u_vignette',
    transform: (value) => Easing.easeInOutQuad(value),
  },
  {
    key: 'chromatic',
    label: 'Chromatic Aberration',
    uniform: 'u_chromatic',
    transform: (value) => Easing.easeInOutCubic(value),
  },
  {
    key: 'scanline',
    label: 'Scanline Mask',
    uniform: 'u_scanline',
    transform: (value) => Easing.easeInOutQuad(value),
  },
  {
    key: 'posterize',
    label: 'Posterize Levels',
    uniform: 'u_posterize',
    transform: (value) => value,
  },
  {
    key: 'glow',
    label: 'Bloom Glow',
    uniform: 'u_glow',
    transform: (value) => Easing.easeInOutCubic(value),
  },
  {
    key: 'mirror',
    label: 'Mirror Blend',
    uniform: 'u_mirror',
    transform: (value) => Easing.easeInOutSine(value),
  },
];

const POST_EFFECT_LOOKUP = new Map<string, PostEffectDefinition>(
  POST_EFFECT_POOL.map((effect) => [effect.key, effect]),
);

function normalizeSelection(selection: PostEffectSelectionInput): string[] {
  if (Array.isArray(selection)) {
    return [...selection];
  }
  const { primary, fallback = [] } = selection;
  return [...primary, ...fallback];
}

/**
 * 指定したキー配列（もしくはプラン）からフェーダーに割り当てるポストエフェクトを構築します。
 * 同じuniformを共有するエフェクトは重複しないように自動除外され、足りない分はプールから補完されます。
 */
export function buildActivePostEffects(selection: PostEffectSelectionInput): PostEffectDefinition[] {
  const resolved: PostEffectDefinition[] = [];
  const usedUniforms = new Set<string>();
  const requestedKeys = normalizeSelection(selection);

  requestedKeys.forEach((key) => {
    const effect = POST_EFFECT_LOOKUP.get(key);
    if (effect && !usedUniforms.has(effect.uniform)) {
      resolved.push(effect);
      usedUniforms.add(effect.uniform);
    }
  });

  if (resolved.length < 8) {
    for (const effect of POST_EFFECT_POOL) {
      if (resolved.length >= 8) {
        break;
      }
      if (!usedUniforms.has(effect.uniform)) {
        resolved.push(effect);
        usedUniforms.add(effect.uniform);
      }
    }
  }

  return resolved.slice(0, 8);
}

/**
 * デフォルトのフェーダー割り当てプラン。
 * `primary` にライブで使いたい順序を並べ、足りない場合は `fallback` から自動補完されます。
 */
export const POST_EFFECT_SELECTION_PLAN: PostEffectSelectionPlan = {
  primary: [
    'wave',
    'glow',
    'chromatic',
    'vignette',
    'posterize',
    'scanline',
    'cutGlitch',
    'mirror',
  ],
  fallback: ['mosaic', 'noise', 'tile', 'colorize', 'monochrome', 'invert'],
};

export const DEFAULT_POST_EFFECT_SELECTION: string[] = POST_EFFECT_SELECTION_PLAN.primary;

/**
 * 利用者がフェーダー割り当てを選ぶ際のサンプルプリセット。
 * 任意のプリセットを `buildActivePostEffects` に渡すだけで構成を切り替えられます。
 */
export const POST_EFFECT_PRESETS: Record<string, PostEffectSelectionPlan> = {
  performance: POST_EFFECT_SELECTION_PLAN,
  minimal: {
    primary: ['glow', 'vignette', 'chromatic'],
    fallback: ['wave', 'posterize', 'scanline', 'monochrome', 'invert'],
  },
  glitch: {
    primary: ['cutGlitch', 'mosaic', 'noise', 'tile'],
    fallback: ['wave', 'chromatic', 'scanline', 'mirror', 'invert'],
  },
};

export const ACTIVE_POST_EFFECTS: PostEffectDefinition[] = buildActivePostEffects(
  POST_EFFECT_SELECTION_PLAN,
);

export const POST_EFFECT_UNIFORMS: string[] = Array.from(
  new Set(POST_EFFECT_POOL.map((effect) => effect.uniform)),
);

export function resolvePostEffectValue(effect: PostEffectDefinition, rawValue: number): number {
  const clamped = Math.min(Math.max(rawValue, 0), 1);
  return effect.transform ? effect.transform(clamped) : clamped;
}
