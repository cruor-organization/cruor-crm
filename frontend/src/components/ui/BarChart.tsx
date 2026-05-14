/**
 * Gráfico de barras horizontal simples, baseado em divs (sem dependências externas).
 */

interface BarChartItem {
  label: string;
  value: number;
  sublabel?: string;
}

interface BarChartProps {
  data: BarChartItem[];
  format?: (n: number) => string;
  colorClass?: string;
  maxItems?: number;
}

export function BarChart({
  data,
  format = (n) => String(n),
  colorClass = 'bg-cruor-500',
  maxItems = 10,
}: BarChartProps) {
  const items = data.slice(0, maxItems);
  const max = Math.max(...items.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const pct = Math.max((item.value / max) * 100, 2);
        return (
          <div key={idx} className="flex items-center gap-3 text-sm">
            <span
              className="w-40 shrink-0 truncate text-right text-xs text-neutral-600"
              title={item.label}
            >
              {item.label}
            </span>
            <div className="flex flex-1 items-center gap-2">
              <div className="h-5 flex-1 rounded-sm bg-neutral-100">
                <div
                  className={`h-5 rounded-sm ${colorClass} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-xs font-medium text-neutral-700">
                {format(item.value)}
                {item.sublabel && <span className="ml-1 text-neutral-400">{item.sublabel}</span>}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
