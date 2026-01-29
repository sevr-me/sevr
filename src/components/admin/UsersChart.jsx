export function UsersChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    )
  }

  // For single data point, pad with a zero start point to show growth
  const chartData = data.length === 1
    ? [{ date: getPreviousDay(data[0].date), count: 0 }, ...data]
    : data

  // Calculate dimensions
  const width = 500
  const height = 200
  const padding = { top: 20, right: 20, bottom: 30, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calculate scales
  const maxCount = Math.max(...chartData.map(d => d.count), 1)
  const minCount = 0

  // Create points for the line
  const points = chartData.map((d, i) => {
    const x = padding.left + (i / (chartData.length - 1 || 1)) * chartWidth
    const y = padding.top + chartHeight - ((d.count - minCount) / (maxCount - minCount || 1)) * chartHeight
    return { x, y, ...d }
  })

  // Create path
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  // Create area path
  const areaD = `${pathD} L ${points[points.length - 1]?.x || padding.left} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`

  // Y-axis ticks
  const yTicks = [0, Math.round(maxCount / 2), maxCount]

  // X-axis labels (show first, middle, last)
  const xLabels = chartData.length <= 3 ? chartData : [chartData[0], chartData[Math.floor(chartData.length / 2)], chartData[chartData.length - 1]]

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const y = padding.top + chartHeight - (tick / (maxCount || 1)) * chartHeight
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.1}
              />
              <text
                x={padding.left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {tick}
              </text>
            </g>
          )
        })}

        {/* Area fill */}
        <path
          d={areaD}
          fill="currentColor"
          fillOpacity={0.1}
          className="text-primary"
        />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="text-primary"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="currentColor"
            className="text-primary"
          />
        ))}

        {/* X-axis labels */}
        {xLabels.map((d, i) => {
          const idx = chartData.indexOf(d)
          const x = padding.left + (idx / (chartData.length - 1 || 1)) * chartWidth
          return (
            <text
              key={i}
              x={x}
              y={height - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {formatDate(d.date)}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getPreviousDay(dateStr) {
  const date = new Date(dateStr)
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}
