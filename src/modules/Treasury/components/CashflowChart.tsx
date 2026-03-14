interface CashflowDataPoint {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
}

interface CashflowChartProps {
  data: CashflowDataPoint[];
  title?: string;
  showLegend?: boolean;
}

const CashflowChart = ({ data, title = 'Inflow vs Outflow Trend', showLegend = true }: CashflowChartProps) => {
  const maxValue = Math.max(...data.map(d => Math.max(d.inflow, d.outflow)));

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      {title && <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>}
      <div className="h-80 flex flex-col justify-end gap-2">
        <div className="flex items-end gap-3 h-full">
          {data.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              {/* Dual bar chart */}
              <div className="flex items-end gap-1 h-56">
                <div
                  className="flex-1 bg-green-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                  style={{ height: `${(item.inflow / maxValue) * 100}%` }}
                  title={`Inflow: ₱${item.inflow.toLocaleString()}`}
                />
                <div
                  className="flex-1 bg-red-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                  style={{ height: `${(item.outflow / maxValue) * 100}%` }}
                  title={`Outflow: ₱${item.outflow.toLocaleString()}`}
                />
              </div>
              <span className="text-xs text-muted text-center">{item.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-foreground">Inflows</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-foreground">Outflows</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowChart;
