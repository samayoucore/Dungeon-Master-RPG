import { useEffect, useMemo, useRef } from 'react';
import type { Dungeon, RoomType } from '../../types';

const CANVAS_W = 260;
const CANVAS_H = 195;

const COLOR = {
  bg: '#0d1117',
  roomVisited: '#21262d',
  roomVisitedBorder: '#30363d',
  roomRevealed: '#161b22',
  current: '#c9a227',
  corridor: '#1a1f27',
  boss: '#8b1a1a',
  treasure: '#c9a227',
  shop: '#0ea5e9',
  icon: '#e8d5b0',
  dot: '#c9a227',
};

const TILE_ICON: Partial<Record<RoomType, string>> = {
  entrance: '⬛',
  treasure: '★',
  shop: '$',
  boss: '☠',
  library: '📖',
  trap: '⚡',
  puzzle: '?',
};

interface DrawRoom {
  x: number; y: number; w: number; h: number;
  cx: number; cy: number;
  type: RoomType;
  visited: boolean;
  isCurrent: boolean;
  icon?: string;
}
interface Corridor { x1: number; y1: number; x2: number; y2: number }
interface DrawData {
  rooms: DrawRoom[];
  corridors: Corridor[];
  current: { x: number; y: number } | null;
}

/** Derive pixel-space geometry for revealed/visited rooms only (fog of war). */
function computeDrawData(dungeon: Dungeon, scaleX: number, scaleY: number): DrawData {
  const byId = new Map(dungeon.rooms.map((room) => [room.id, room]));
  const cx = (r: { rect: { x: number; w: number } }) => (r.rect.x + r.rect.w / 2) * scaleX;
  const cy = (r: { rect: { y: number; h: number } }) => (r.rect.y + r.rect.h / 2) * scaleY;
  const known = (id: string) => {
    const r = byId.get(id);
    return r ? r.isRevealed || r.isVisited : false;
  };

  const rooms: DrawRoom[] = dungeon.rooms
    .filter((r) => r.isRevealed || r.isVisited)
    .map((r) => ({
      x: r.rect.x * scaleX,
      y: r.rect.y * scaleY,
      w: r.rect.w * scaleX,
      h: r.rect.h * scaleY,
      cx: cx(r),
      cy: cy(r),
      type: r.type,
      visited: r.isVisited,
      isCurrent: r.id === dungeon.currentRoomId,
      icon: TILE_ICON[r.type],
    }));

  const corridors: Corridor[] = [];
  const seen = new Set<string>();
  for (const r of dungeon.rooms) {
    if (!(r.isRevealed || r.isVisited)) continue;
    for (const neighbourId of r.connections) {
      if (!known(neighbourId)) continue;
      const key = [r.id, neighbourId].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      const n = byId.get(neighbourId)!;
      corridors.push({ x1: cx(r), y1: cy(r), x2: cx(n), y2: cy(n) });
    }
  }

  const current = byId.get(dungeon.currentRoomId);
  return { rooms, corridors, current: current ? { x: cx(current), y: cy(current) } : null };
}

/** Repaint the whole (small) canvas each frame; `pulse` drives the marker dot. */
function paint(ctx: CanvasRenderingContext2D, data: DrawData, pulse: number): void {
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.strokeStyle = COLOR.corridor;
  ctx.lineWidth = 1;
  for (const c of data.corridors) {
    ctx.beginPath();
    ctx.moveTo(c.x1, c.y1);
    ctx.lineTo(c.x2, c.y1);
    ctx.lineTo(c.x2, c.y2);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '8px sans-serif';
  for (const r of data.rooms) {
    ctx.globalAlpha = r.visited ? 1 : 0.6;
    ctx.fillStyle = r.visited ? COLOR.roomVisited : COLOR.roomRevealed;
    ctx.fillRect(r.x, r.y, r.w, r.h);

    ctx.globalAlpha = 1;
    let border = COLOR.roomVisitedBorder;
    let width = 1;
    if (r.isCurrent) { border = COLOR.current; width = 2; }
    else if (r.type === 'boss') border = COLOR.boss;
    else if (r.type === 'treasure') border = COLOR.treasure;
    else if (r.type === 'shop') border = COLOR.shop;
    ctx.strokeStyle = border;
    ctx.lineWidth = width;
    ctx.setLineDash(r.type === 'treasure' && !r.visited ? [2, 2] : []);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.setLineDash([]);

    if (r.icon && r.visited && !r.isCurrent) {
      ctx.fillStyle = COLOR.icon;
      ctx.fillText(r.icon, r.cx, r.cy);
    }
  }

  ctx.globalAlpha = 1;
  if (data.current) {
    const radius = 3 + Math.sin(pulse); // oscillates 2..4
    ctx.fillStyle = COLOR.dot;
    ctx.beginPath();
    ctx.arc(data.current.x, data.current.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

interface DungeonMapProps {
  dungeon: Dungeon;
}

/** Canvas mini-map with fog of war and a pulsing "you are here" marker. */
export default function DungeonMap({ dungeon }: DungeonMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleX = CANVAS_W / dungeon.width;
  const scaleY = CANVAS_H / dungeon.height;

  // Recompute geometry only when the dungeon (rooms / current room) changes.
  const drawData = useMemo(() => computeDrawData(dungeon, scaleX, scaleY), [dungeon, scaleX, scaleY]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    let pulse = 0;
    const loop = () => {
      paint(ctx, drawData, pulse);
      pulse += 0.08;
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frame);
  }, [drawData]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="mx-auto block h-auto max-w-full rounded-md border border-surface-elevated bg-dungeon"
    />
  );
}
