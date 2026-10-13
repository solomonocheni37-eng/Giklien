import { createEffect, onMount } from "solid-js";

export type PadState = {
  points: number;
  startedAt: number | null;
  dataUrl: string | null;
};

type Point = { x: number; y: number; t: number };

const MIN_WIDTH = 1.4;
const MAX_WIDTH = 3.8;

export default function SignaturePad(props: {
  onChange: (state: PadState) => void;
  clearTick: () => number;
}) {
  let canvasRef: HTMLCanvasElement | undefined;
  let ctx: CanvasRenderingContext2D | null = null;

  let drawing = false;
  let pointCount = 0;
  let startedAt: number | null = null;

  let last: Point | null = null;
  let lastMid: Point | null = null;
  let currentWidth = (MIN_WIDTH + MAX_WIDTH) / 2;

  const setup = () => {
    const canvas = canvasRef;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Dark ink on paper-white pad (light theme).
    ctx.strokeStyle = "#1c1917";
    ctx.fillStyle = "#1c1917";
  };

  onMount(setup);

  const emit = () => {
    props.onChange({
      points: pointCount,
      startedAt,
      dataUrl: pointCount > 0 ? canvasRef?.toDataURL("image/png") ?? null : null,
    });
  };

  const clear = () => {
    const canvas = canvasRef;
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    pointCount = 0;
    startedAt = null;
    last = null;
    lastMid = null;
    currentWidth = (MIN_WIDTH + MAX_WIDTH) / 2;
    emit();
  };

  createEffect(() => {
    const tick = props.clearTick();
    if (tick > 0) clear();
  });

  const toPoint = (e: PointerEvent): Point => {
    const rect = canvasRef!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      t: e.timeStamp || Date.now(),
    };
  };

  const widthFor = (a: Point, b: Point): number => {
    const dt = Math.max(b.t - a.t, 1);
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const velocity = dist / dt;
    const target = MAX_WIDTH - velocity * 1.2;
    const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, target));
    currentWidth += (clamped - currentWidth) * 0.25;
    return currentWidth;
  };

  const drawSegment = (from: Point, control: Point, to: Point) => {
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(control.x, control.y, to.x, to.y);
    ctx.lineWidth = widthFor(control, to);
    ctx.stroke();
  };

  const addPoint = (p: Point) => {
    pointCount += 1;

    if (!last) {
      last = p;
      lastMid = p;
      if (ctx) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    const mid: Point = {
      x: (last.x + p.x) / 2,
      y: (last.y + p.y) / 2,
      t: p.t,
    };

    drawSegment(lastMid!, last, mid);
    lastMid = mid;
    last = p;
  };

  const onDown = (e: PointerEvent) => {
    if (!canvasRef || !ctx) return;
    drawing = true;
    if (!startedAt) startedAt = Date.now();
    try {
      canvasRef.setPointerCapture(e.pointerId);
    } catch {
      // Older browsers may not support pointer capture.
    }
    last = null;
    lastMid = null;
    addPoint(toPoint(e));
  };

  const onMove = (e: PointerEvent) => {
    if (!drawing) return;

    let events: PointerEvent[] = [e];
    if (typeof e.getCoalescedEvents === "function") {
      const coalesced = e.getCoalescedEvents();
      if (coalesced.length > 0) events = coalesced;
    }

    for (const ev of events) addPoint(toPoint(ev));
  };

  const onUp = () => {
    if (!drawing) return;
    drawing = false;

    if (ctx && last && lastMid) {
      ctx.beginPath();
      ctx.moveTo(lastMid.x, lastMid.y);
      ctx.quadraticCurveTo(last.x, last.y, last.x, last.y);
      ctx.lineWidth = currentWidth;
      ctx.stroke();
    }

    emit();
  };

  return (
    <canvas
      ref={canvasRef}
      class="pad"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      aria-label="Signature pad"
    />
  );
}
