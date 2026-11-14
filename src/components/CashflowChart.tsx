import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { MonthlyCashflowPoint } from '../types';
import { formatCentsToBRL } from '../utils/formatters';

interface CashflowChartProps {
  data: MonthlyCashflowPoint[];
  loading?: boolean;
  masked?: boolean;
}

export const CashflowChart: React.FC<CashflowChartProps> = ({
  data,
  loading = false,
  masked = false,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [metricView, setMetricView] = useState<'cashflow' | 'patrimonio'>(
    'cashflow'
  );

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse" aria-busy="true">
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-8 w-44 rounded-lg bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="h-10 rounded-xl bg-slate-100 dark:bg-white/5" />
        <div className="h-52 rounded-xl bg-slate-100 dark:bg-white/5" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center space-y-2">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-400 dark:text-[#908fa0]">
          <BarChart3 className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-[#dae2fd]">
          Nenhum dado histórico disponível
        </p>
        <p className="text-xs text-slate-500 dark:text-[#908fa0] max-w-sm mx-auto">
          O gráfico de fluxo mensal e evolução patrimonial será exibido assim que houver movimentações registradas.
        </p>
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const padLeft = 12;
  const padRight = 12;
  const padTop = 20;
  const padBottom = 32;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxCash = Math.max(
    ...data.flatMap((d) => [d.incomeCents, d.expenseCents]),
    100
  );
  const maxBalance = Math.max(...data.map((d) => d.netBalanceCents), 100);
  const minBalance = Math.min(...data.map((d) => d.netBalanceCents)) * 0.85;

  const activeIndex =
    hoveredIdx !== null && hoveredIdx < data.length ? hoveredIdx : data.length - 1;
  const activePoint = data[activeIndex];

  const barGroupWidth = plotW / data.length;
  const barWidth = Math.min(20, barGroupWidth * 0.24);

  const linePoints = data.map((d, idx) => {
    const x = padLeft + barGroupWidth * idx + barGroupWidth / 2;
    const ratio =
      maxBalance === minBalance
        ? 0.5
        : (d.netBalanceCents - minBalance) / (maxBalance - minBalance);
    const y = padTop + plotH - ratio * (plotH * 0.82);
    return { x, y, ...d };
  });

  const polylinePath = linePoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath =
    linePoints.length > 0
      ? `${polylinePath} L ${linePoints[linePoints.length - 1].x} ${
          padTop + plotH
        } L ${linePoints[0].x} ${padTop + plotH} Z`
      : '';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-[#c7c4d7]">
          {metricView === 'cashflow' ? (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                Entradas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                Saídas
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" />
              Evolução Patrimonial
            </span>
          )}
        </div>

        <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-[#0b1326] border border-slate-200 dark:border-white/8">
          <button
            type="button"
            onClick={() => setMetricView('cashflow')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              metricView === 'cashflow'
                ? 'bg-white dark:bg-[#222a3d] text-slate-900 dark:text-[#dae2fd] shadow-sm'
                : 'text-slate-600 dark:text-[#c7c4d7] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Fluxo Mensal
          </button>
          <button
            type="button"
            onClick={() => setMetricView('patrimonio')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              metricView === 'patrimonio'
                ? 'bg-white dark:bg-[#222a3d] text-slate-900 dark:text-[#dae2fd] shadow-sm'
                : 'text-slate-600 dark:text-[#c7c4d7] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Patrimônio
          </button>
        </div>
      </div>

      {activePoint && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0b1326]/70 border border-slate-200/80 dark:border-white/6 text-xs">
          <span className="font-semibold text-slate-800 dark:text-[#dae2fd]">
            {activePoint.monthLabel}
          </span>
          <div className="flex flex-wrap items-center gap-4 tabular-nums">
            <span className="text-emerald-600 dark:text-[#4edea3] font-medium">
              Entradas:{' '}
              {masked ? '•••••' : formatCentsToBRL(activePoint.incomeCents)}
            </span>
            <span className="text-slate-700 dark:text-[#c7c4d7] font-medium">
              Saídas:{' '}
              {masked ? '•••••' : formatCentsToBRL(activePoint.expenseCents)}
            </span>
            <span className="text-indigo-600 dark:text-[#c0c1ff] font-semibold">
              Saldo:{' '}
              {masked ? '•••••' : formatCentsToBRL(activePoint.netBalanceCents)}
            </span>
          </div>
        </div>
      )}

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-52 overflow-visible select-none"
          role="img"
          aria-label="Gráfico de evolução financeira mensal"
        >
          <defs>
            <linearGradient id="patrimonioGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((step) => {
            const y = padTop + plotH - plotH * step;
            return (
              <line
                key={step}
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                className="stroke-slate-200 dark:stroke-white/6"
                strokeDasharray="3 4"
                strokeWidth={1}
              />
            );
          })}

          {metricView === 'cashflow' ? (
            data.map((point, idx) => {
              const centerX = padLeft + barGroupWidth * idx + barGroupWidth / 2;
              const incomeH = (point.incomeCents / maxCash) * (plotH * 0.9);
              const expenseH = (point.expenseCents / maxCash) * (plotH * 0.9);
              const isSelected = activeIndex === idx;

              return (
                <g
                  key={point.monthLabel}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer"
                >
                  <rect
                    x={padLeft + barGroupWidth * idx + 4}
                    y={padTop}
                    width={barGroupWidth - 8}
                    height={plotH}
                    rx={8}
                    className={
                      isSelected
                        ? 'fill-slate-200/60 dark:fill-white/[0.04]'
                        : 'fill-transparent'
                    }
                  />
                  <rect
                    x={centerX - barWidth - 3}
                    y={padTop + plotH - incomeH}
                    width={barWidth}
                    height={Math.max(4, incomeH)}
                    rx={5}
                    className="fill-emerald-500 dark:fill-[#4edea3] transition-opacity duration-150"
                    opacity={isSelected ? 1 : 0.78}
                  />
                  <rect
                    x={centerX + 3}
                    y={padTop + plotH - expenseH}
                    width={barWidth}
                    height={Math.max(4, expenseH)}
                    rx={5}
                    className="fill-indigo-500 dark:fill-[#8083ff] transition-opacity duration-150"
                    opacity={isSelected ? 1 : 0.75}
                  />
                  <text
                    x={centerX}
                    y={height - 8}
                    textAnchor="middle"
                    className={`text-[11px] font-medium ${
                      isSelected
                        ? 'fill-slate-900 dark:fill-[#dae2fd] font-semibold'
                        : 'fill-slate-500 dark:fill-[#908fa0]'
                    }`}
                  >
                    {point.monthLabel}
                  </text>
                </g>
              );
            })
          ) : (
            <>
              <path d={areaPath} fill="url(#patrimonioGrad)" />
              <path
                d={polylinePath}
                fill="none"
                stroke="#6366F1"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {linePoints.map((pt, idx) => {
                const isSelected = activeIndex === idx;
                return (
                  <g
                    key={pt.monthLabel}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={padLeft + barGroupWidth * idx}
                      y={padTop}
                      width={barGroupWidth}
                      height={plotH + 24}
                      fill="transparent"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 6 : 4}
                      className="fill-indigo-500 dark:fill-[#c0c1ff] stroke-white dark:stroke-[#131b2e]"
                      strokeWidth={2}
                    />
                    <text
                      x={pt.x}
                      y={height - 8}
                      textAnchor="middle"
                      className={`text-[11px] font-medium ${
                        isSelected
                          ? 'fill-slate-900 dark:fill-[#dae2fd] font-semibold'
                          : 'fill-slate-500 dark:fill-[#908fa0]'
                      }`}
                    >
                      {pt.monthLabel}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
