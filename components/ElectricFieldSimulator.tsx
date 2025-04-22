// components/ElectricFieldSimulator.tsx
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { debounce } from 'lodash-es';

type Charge = {
  x: number;
  y: number;
  q: number;
  id: number;
};

type FieldLine = {
  points: Array<{ x: number; y: number }>;
};

const k = 8.988e9;
const STEP_SIZE = 3;
const MAX_STEPS = 2000;
const CHARGE_RADIUS = 20;
const FIELD_LINE_DENSITY = 24;
const ARROW_SPACING = 60;
const ARROW_SIZE = 8;

const ElectricFieldSimulator = ({
  width = 1000,
  height = 600,
}: {
  width?: number;
  height?: number;
}) => {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [selectedChargeType, setSelectedChargeType] = useState<1 | -1>(1);
  const [showElectricField, setShowElectricField] = useState(true);
  const [fieldLines, setFieldLines] = useState<FieldLine[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Υπολογισμός έντασης ηλεκτρικού πεδίου
  const calculateElectricField = useCallback((x: number, y: number) => {
    let Ex = 0, Ey = 0;
    charges.forEach(({ x: cx, y: cy, q }) => {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r < 5) return;
      
      const E = (k * q) / (r * r);
      Ex += E * (dx / r);
      Ey += E * (dy / r);
    });
    return { Ex, Ey };
  }, [charges]);

  // 场线追踪算法
  const traceFieldLine = useCallback((startX: number, startY: number, direction: number): FieldLine => {
    const points = [];
    let x = startX, y = startY;
    let steps = 0;
    let hitTarget = false;

    while (steps++ < MAX_STEPS && !hitTarget) {
      points.push({ x, y });
      
      const { Ex, Ey } = calculateElectricField(x, y);
      const magnitude = Math.sqrt(Ex * Ex + Ey * Ey);
      if (magnitude < 1e-3) break;

      const dynamicStep = Math.max(STEP_SIZE * (1 - 1/(magnitude/1e3 + 1)), 0.5);
      const dx = (direction * Ex) / magnitude * dynamicStep;
      const dy = (direction * Ey) / magnitude * dynamicStep;

      x += dx;
      y += dy;

      if (x < 0 || x > width || y < 0 || y > height) break;

      hitTarget = charges.some(c => {
        const dist = Math.hypot(x - c.x, y - c.y);
        const isOpposite = direction === 1 ? c.q < 0 : c.q > 0;
        return dist < CHARGE_RADIUS && (isOpposite || dist < 15);
      });
    }

    if (hitTarget && points.length > 1) {
      const lastCharge = charges.find(c => 
        Math.hypot(x - c.x, y - c.y) < CHARGE_RADIUS
      );
      if (lastCharge) {
        points.push({ x: lastCharge.x, y: lastCharge.y });
      }
    }

    return { points };
  }, [calculateElectricField, charges, width, height]);

  // 生成场线（防抖处理）
  const generateFieldLines = useMemo(
    () => debounce(() => {
      const lines: FieldLine[] = [];
      
      charges.forEach(charge => {
        if (charge.q > 0) {
          Array.from({ length: FIELD_LINE_DENSITY }).forEach((_, i) => {
            const angle = (i * 2 * Math.PI) / FIELD_LINE_DENSITY;
            const startX = charge.x + CHARGE_RADIUS * Math.cos(angle);
            const startY = charge.y + CHARGE_RADIUS * Math.sin(angle);
            lines.push(traceFieldLine(startX, startY, 1));
          });
        } else {
          Array.from({ length: FIELD_LINE_DENSITY }).forEach((_, i) => {
            const angle = (i * 2 * Math.PI) / FIELD_LINE_DENSITY;
            const startX = charge.x + CHARGE_RADIUS * Math.cos(angle);
            const startY = charge.y + CHARGE_RADIUS * Math.sin(angle);
            lines.push(traceFieldLine(startX, startY, -1));
          });
        }
      });

      setFieldLines(lines.filter(line => line.points.length > 5));
    }, 300),
    [charges, traceFieldLine]
  );

  // 绘制箭头
  const drawArrow = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    isPositiveCharge: boolean
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.beginPath();
    if (isPositiveCharge) {
      // 正电荷：箭头向外
      ctx.moveTo(0, 0);
      ctx.lineTo(-ARROW_SIZE * 2, -ARROW_SIZE);
      ctx.lineTo(-ARROW_SIZE * 1.8, 0);
      ctx.lineTo(-ARROW_SIZE * 2, ARROW_SIZE);
    } else {
      // 负电荷：箭头向内
      ctx.moveTo(-ARROW_SIZE * 2, 0);
      ctx.lineTo(0, -ARROW_SIZE);
      ctx.lineTo(-ARROW_SIZE * 0.2, 0);
      ctx.lineTo(0, ARROW_SIZE);
    }
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(255, 80, 80, 0.9)';
    ctx.fill();
    ctx.restore();
  }, []);

  // 主绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (showElectricField) {
      ctx.strokeStyle = 'rgba(255, 80, 80, 0.6)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      fieldLines.forEach(({ points }) => {
        if (points.length < 2) return;

        // 找到这条场线起始点最近的电荷
        const startPoint = points[0];
        const nearestCharge = charges.find(c => 
          Math.hypot(startPoint.x - c.x, startPoint.y - c.y) < CHARGE_RADIUS * 1.5
        );
        const isPositiveCharge = nearestCharge?.q ? nearestCharge.q > 0 : true;

        // 绘制场线
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const prev = points[i-1];
          const curr = points[i];
          const cpX = (prev.x + curr.x) / 2;
          const cpY = (prev.y + curr.y) / 2;
          ctx.quadraticCurveTo(cpX, cpY, curr.x, curr.y);
        }
        ctx.stroke();

        // 绘制箭头
        let accumulatedLength = 0;
        for (let i = 1; i < points.length; i++) {
          const prev = points[i-1];
          const curr = points[i];
          const dx = curr.x - prev.x;
          const dy = curr.y - prev.y;
          const segmentLength = Math.hypot(dx, dy);
          
          accumulatedLength += segmentLength;
          
          if (accumulatedLength >= ARROW_SPACING) {
            const t = (ARROW_SPACING - (accumulatedLength - segmentLength)) / segmentLength;
            const arrowX = prev.x + dx * t;
            const arrowY = prev.y + dy * t;
            const angle = Math.atan2(dy, dx);
            
            drawArrow(ctx, arrowX, arrowY, angle, isPositiveCharge);

            accumulatedLength = 0;
          }
        }
      });
    }

    // 绘制电荷
    charges.forEach(charge => {
      ctx.beginPath();
      ctx.arc(charge.x, charge.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = charge.q > 0 ? '#ff4444' : '#4444ff';
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(charge.q > 0 ? '+' : '−', charge.x, charge.y);
    });
  }, [charges, fieldLines, showElectricField, width, height, drawArrow]);

  // 交互处理
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCharges(prev => [
      ...prev,
      { x, y, q: selectedChargeType * 1e-6, id: Date.now() }
    ]);
  };

  const handleDrag = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingId) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCharges(prev => 
      prev.map(c => c.id === draggingId ? { ...c, x, y } : c)
    );
  }, [draggingId]);

  // 效果管理
  useEffect(() => {
    generateFieldLines();
    return () => generateFieldLines.cancel();
  }, [charges]);

  useEffect(() => {
    const animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  return (
    <div className="simulator">
      <div className="controls">
        <button 
          onClick={() => setSelectedChargeType(1)}
          className={selectedChargeType === 1 ? 'active' : ''}
        >
          ➕ Θετικό φορτίο
        </button>
        <button
          onClick={() => setSelectedChargeType(-1)}
          className={selectedChargeType === -1 ? 'active' : ''}
        >
          ➖ Αρνητικό φορτίο
        </button>
        <button onClick={() => setCharges([])}>🧹 Καθαρισμός</button>
        <label>
          <input
            type="checkbox"
            checked={showElectricField}
            onChange={(e) => setShowElectricField(e.target.checked)}
          />
          ⚡ Γραμμές πεδίου
        </label>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const charge = charges.find(c => 
            Math.hypot(x - c.x, y - c.y) < CHARGE_RADIUS
          );
          if (charge) setDraggingId(charge.id);
        }}
        onMouseMove={handleDrag}
        onMouseUp={() => setDraggingId(null)}
        onMouseLeave={() => setDraggingId(null)}
      />
    </div>
  );
};

export default ElectricFieldSimulator;