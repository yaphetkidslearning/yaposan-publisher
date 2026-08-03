import type { PublisherElement, PublisherPage, PublisherProject } from "../types/publisher";

export type AnimationPreset = "fade-in" | "fade-out" | "appear" | "disappear" | "fly-in" | "fly-out" | "zoom-in" | "zoom-out" | "grow-shrink" | "spin" | "wipe" | "float" | "bounce" | "pulse";
export type AnimationEasing = "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "cubic" | "quart" | "quint" | "elastic" | "bounce";
export type AnimationDirection = "normal" | "reverse" | "alternate";
export type AnimationTrigger = "on-load" | "on-click" | "after-previous" | "with-previous";
export type AnimationProperty = "x" | "y" | "scaleX" | "scaleY" | "rotation" | "opacity";
export type CubicBezier = [number, number, number, number];
export type AnimationKeyframeValue = Partial<Record<AnimationProperty, number>>;
export type AnimationKeyframe = { id: string; time: number; value: AnimationKeyframeValue; easing?: AnimationEasing; bezier?: CubicBezier };
export type MotionPathPoint = { x: number; y: number };
export type MotionPath = { id: string; name: string; points: MotionPathPoint[]; closed: boolean; orientToPath: boolean };
export type AnimationClipboard = { version: "19.1"; animations: ElementAnimation[] };

export type ElementAnimation = {
  id: string;
  name: string;
  preset: AnimationPreset;
  duration: number;
  delay: number;
  easing: AnimationEasing;
  repeat: number;
  direction: AnimationDirection;
  trigger: AnimationTrigger;
  autoReverse: boolean;
  enabled: boolean;
  keyframes?: AnimationKeyframe[];
  motionPath?: MotionPath;
  customBezier?: CubicBezier;
};

export type AnimationProjectSettings = {
  duration: number;
  fps: 12 | 24 | 30 | 60;
  loop: boolean;
  playbackSpeed: 0.25 | 0.5 | 1 | 1.5 | 2;
  snapToFrames: boolean;
  timelineZoom: number;
};

export const DEFAULT_ANIMATION_PROJECT_SETTINGS: AnimationProjectSettings = {
  duration: 5,
  fps: 30,
  loop: true,
  playbackSpeed: 1,
  snapToFrames: true,
  timelineZoom: 1,
};

export const ANIMATION_PRESETS: Array<{ id: AnimationPreset; label: string; category: "Entrance" | "Exit" | "Emphasis" }> = [
  { id: "fade-in", label: "Fade In", category: "Entrance" }, { id: "appear", label: "Appear", category: "Entrance" },
  { id: "fly-in", label: "Fly In", category: "Entrance" }, { id: "zoom-in", label: "Zoom In", category: "Entrance" },
  { id: "fade-out", label: "Fade Out", category: "Exit" }, { id: "disappear", label: "Disappear", category: "Exit" },
  { id: "fly-out", label: "Fly Out", category: "Exit" }, { id: "zoom-out", label: "Zoom Out", category: "Exit" },
  { id: "grow-shrink", label: "Grow/Shrink", category: "Emphasis" }, { id: "spin", label: "Spin", category: "Emphasis" },
  { id: "wipe", label: "Wipe", category: "Emphasis" }, { id: "float", label: "Float", category: "Emphasis" },
  { id: "bounce", label: "Bounce", category: "Emphasis" }, { id: "pulse", label: "Pulse", category: "Emphasis" },
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ease = (t: number, easing: AnimationEasing) => {
  const x = clamp01(t);
  if (easing === "linear") return x;
  if (easing === "ease-in") return x * x;
  if (easing === "ease-out") return 1 - (1 - x) * (1 - x);
  if (easing === "ease-in-out") return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  if (easing === "cubic") return x * x * x;
  if (easing === "quart") return x ** 4;
  if (easing === "quint") return x ** 5;
  if (easing === "elastic") return x === 0 || x === 1 ? x : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * (2 * Math.PI / 3)) + 1;
  if (easing === "bounce") return Math.abs(Math.sin(6.28 * (x + 1) * (1 - x)));
  return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
};

export function createElementAnimation(preset: AnimationPreset): ElementAnimation {
  const label = ANIMATION_PRESETS.find((item) => item.id === preset)?.label ?? preset;
  return { id: `anim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: label, preset, duration: 1, delay: 0, easing: "ease-in-out", repeat: 1, direction: "normal", trigger: "on-load", autoReverse: false, enabled: true };
}

export function addAnimationToElement(element: PublisherElement, animation: ElementAnimation): PublisherElement {
  return { ...element, animations: [...(element.animations ?? []), animation], phase19Version: "19.1" };
}

export function removeAnimationFromElement(element: PublisherElement, animationId: string): PublisherElement {
  return { ...element, animations: (element.animations ?? []).filter((item) => item.id !== animationId), phase19Version: "19.1" };
}

export function updateElementAnimation(element: PublisherElement, animationId: string, updates: Partial<ElementAnimation>): PublisherElement {
  return { ...element, animations: (element.animations ?? []).map((item) => item.id === animationId ? { ...item, ...updates } : item), phase19Version: "19.1" };
}

export function animationDuration(element: PublisherElement): number {
  return (element.animations ?? []).reduce((max, item) => Math.max(max, item.delay + item.duration * Math.max(1, item.repeat)), 0);
}

export function evaluateAnimatedElement(element: PublisherElement, time: number): PublisherElement {
  let next = { ...element };
  for (const animation of element.animations ?? []) {
    if (!animation.enabled || animation.trigger !== "on-load") continue;
    const raw = (time - animation.delay) / Math.max(.01, animation.duration);
    const cycle = Math.max(0, raw);
    let local = clamp01(cycle % 1 || (cycle > 0 ? 1 : 0));
    if (animation.direction === "reverse") local = 1 - local;
    if (animation.direction === "alternate" && Math.floor(cycle) % 2 === 1) local = 1 - local;
    if (animation.autoReverse) local = local < .5 ? local * 2 : (1 - local) * 2;
    const t = ease(local, animation.easing);
    if (raw < 0) local = 0;
    switch (animation.preset) {
      case "fade-in": next.opacity = element.opacity * t; break;
      case "fade-out": next.opacity = element.opacity * (1 - t); break;
      case "appear": next.opacity = raw >= 0 ? element.opacity : 0; break;
      case "disappear": next.opacity = raw >= 1 ? 0 : element.opacity; break;
      case "fly-in": next.x = element.x - (1 - t) * Math.max(100, element.width); next.opacity = element.opacity * t; break;
      case "fly-out": next.x = element.x + t * Math.max(100, element.width); next.opacity = element.opacity * (1 - t); break;
      case "zoom-in": next.width = element.width * Math.max(.01, t); next.height = element.height * Math.max(.01, t); break;
      case "zoom-out": next.width = element.width * (1 - .8 * t); next.height = element.height * (1 - .8 * t); next.opacity = element.opacity * (1 - t); break;
      case "grow-shrink": next.width = element.width * (1 + .12 * Math.sin(t * Math.PI)); next.height = element.height * (1 + .12 * Math.sin(t * Math.PI)); break;
      case "spin": next.rotation = element.rotation + 360 * t; break;
      case "float": next.y = element.y - Math.sin(t * Math.PI) * 24; break;
      case "bounce": next.y = element.y - Math.abs(Math.sin(t * Math.PI * 2)) * 32 * (1 - t * .4); break;
      case "pulse": next.opacity = element.opacity * (.65 + .35 * Math.sin(t * Math.PI)); break;
      case "wipe": next.width = Math.max(1, element.width * t); break;
    }
    const localTime = clamp01(raw) * animation.duration;
    const keyed = interpolateKeyframes(animation, localTime);
    if (keyed) {
      if (keyed.x !== undefined) next.x = element.x + keyed.x;
      if (keyed.y !== undefined) next.y = element.y + keyed.y;
      if (keyed.scaleX !== undefined) next.width = element.width * keyed.scaleX;
      if (keyed.scaleY !== undefined) next.height = element.height * keyed.scaleY;
      if (keyed.rotation !== undefined) next.rotation = element.rotation + keyed.rotation;
      if (keyed.opacity !== undefined) next.opacity = element.opacity * clamp01(keyed.opacity);
    }
    if (animation.motionPath) {
      const motion = pointOnMotionPath(animation.motionPath, t);
      next.x = element.x + motion.point.x;
      next.y = element.y + motion.point.y;
      if (animation.motionPath.orientToPath) next.rotation = element.rotation + motion.angle;
    }
  }
  return next;
}

export function evaluateAnimatedPage(page: PublisherPage, time: number): PublisherPage {
  return { ...page, elements: page.elements.map((element) => evaluateAnimatedElement(element, time)) };
}

export function getAnimationSettings(project: PublisherProject): AnimationProjectSettings {
  return { ...DEFAULT_ANIMATION_PROJECT_SETTINGS, ...(project.animationSettings ?? {}) };
}


export function createAnimationKeyframe(time: number, value: AnimationKeyframeValue): AnimationKeyframe {
  return { id: `key-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time: Math.max(0, time), value, easing: "ease-in-out" };
}

export function addKeyframeToAnimation(element: PublisherElement, animationId: string, keyframe: AnimationKeyframe): PublisherElement {
  return updateElementAnimation(element, animationId, {
    keyframes: [...((element.animations ?? []).find((item) => item.id === animationId)?.keyframes ?? []), keyframe].sort((a, b) => a.time - b.time),
  });
}

export function updateAnimationKeyframe(element: PublisherElement, animationId: string, keyframeId: string, updates: Partial<AnimationKeyframe>): PublisherElement {
  const animation = (element.animations ?? []).find((item) => item.id === animationId);
  if (!animation) return element;
  return updateElementAnimation(element, animationId, { keyframes: (animation.keyframes ?? []).map((item) => item.id === keyframeId ? { ...item, ...updates, time: Math.max(0, updates.time ?? item.time) } : item).sort((a, b) => a.time - b.time) });
}

export function removeAnimationKeyframe(element: PublisherElement, animationId: string, keyframeId: string): PublisherElement {
  const animation = (element.animations ?? []).find((item) => item.id === animationId);
  if (!animation) return element;
  return updateElementAnimation(element, animationId, { keyframes: (animation.keyframes ?? []).filter((item) => item.id !== keyframeId) });
}

export function createMotionPath(points: MotionPathPoint[], name = "Custom Motion Path"): MotionPath {
  return { id: `path-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, points: points.length >= 2 ? points : [{ x: 0, y: 0 }, { x: 120, y: 0 }], closed: false, orientToPath: false };
}

export function setAnimationMotionPath(element: PublisherElement, animationId: string, motionPath?: MotionPath): PublisherElement {
  return updateElementAnimation(element, animationId, { motionPath });
}

export function duplicateElementAnimation(element: PublisherElement, animationId: string): PublisherElement {
  const source = (element.animations ?? []).find((item) => item.id === animationId);
  if (!source) return element;
  const copy: ElementAnimation = JSON.parse(JSON.stringify(source));
  copy.id = `anim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  copy.name = `${source.name} Copy`;
  return addAnimationToElement(element, copy);
}

export function reverseElementAnimation(element: PublisherElement, animationId: string): PublisherElement {
  const source = (element.animations ?? []).find((item) => item.id === animationId);
  if (!source) return element;
  const reversed = (source.keyframes ?? []).map((keyframe) => ({ ...keyframe, time: Math.max(0, source.duration - keyframe.time) })).sort((a, b) => a.time - b.time);
  const path = source.motionPath ? { ...source.motionPath, points: [...source.motionPath.points].reverse() } : undefined;
  return updateElementAnimation(element, animationId, { direction: source.direction === "reverse" ? "normal" : "reverse", keyframes: reversed, motionPath: path });
}

export function copyElementAnimations(element: PublisherElement): AnimationClipboard {
  return { version: "19.1", animations: JSON.parse(JSON.stringify(element.animations ?? [])) };
}

export function pasteElementAnimations(element: PublisherElement, clipboard: AnimationClipboard, replace = false): PublisherElement {
  const pasted = clipboard.animations.map((animation, index) => ({ ...animation, id: `anim-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`, name: `${animation.name} Copy` }));
  return { ...element, animations: replace ? pasted : [...(element.animations ?? []), ...pasted], phase19Version: "19.1" };
}

export function staggerAnimations(elements: PublisherElement[], step = .15): PublisherElement[] {
  return elements.map((element, index) => ({ ...element, animations: (element.animations ?? []).map((animation) => ({ ...animation, delay: animation.delay + Math.max(0, step) * index })), phase19Version: "19.1" }));
}

const cubicBezierProgress = (t: number, bezier?: CubicBezier) => {
  if (!bezier) return t;
  const [, y1, , y2] = bezier;
  const u = 1 - t;
  return clamp01(3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t);
};

function interpolateKeyframes(animation: ElementAnimation, localTime: number): AnimationKeyframeValue | undefined {
  const frames = [...(animation.keyframes ?? [])].sort((a, b) => a.time - b.time);
  if (!frames.length) return undefined;
  if (localTime <= frames[0].time) return frames[0].value;
  if (localTime >= frames[frames.length - 1].time) return frames[frames.length - 1].value;
  const rightIndex = frames.findIndex((frame) => frame.time >= localTime);
  const left = frames[Math.max(0, rightIndex - 1)];
  const right = frames[rightIndex];
  const span = Math.max(.001, right.time - left.time);
  const raw = clamp01((localTime - left.time) / span);
  const progress = cubicBezierProgress(ease(raw, right.easing ?? animation.easing), right.bezier ?? animation.customBezier);
  const result: AnimationKeyframeValue = {};
  const properties: AnimationProperty[] = ["x", "y", "scaleX", "scaleY", "rotation", "opacity"];
  for (const property of properties) {
    const start = left.value[property]; const end = right.value[property];
    if (start !== undefined || end !== undefined) result[property] = (start ?? end ?? 0) + ((end ?? start ?? 0) - (start ?? end ?? 0)) * progress;
  }
  return result;
}

function pointOnMotionPath(path: MotionPath, progress: number) {
  const points = path.closed ? [...path.points, path.points[0]] : path.points;
  if (points.length < 2) return { point: points[0] ?? { x: 0, y: 0 }, angle: 0 };
  const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y));
  const total = lengths.reduce((sum, length) => sum + length, 0) || 1;
  let distance = clamp01(progress) * total;
  for (let index = 0; index < lengths.length; index += 1) {
    if (distance <= lengths[index] || index === lengths.length - 1) {
      const start = points[index]; const end = points[index + 1]; const ratio = clamp01(distance / Math.max(.001, lengths[index]));
      return { point: { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio }, angle: Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI };
    }
    distance -= lengths[index];
  }
  return { point: points[points.length - 1], angle: 0 };
}
