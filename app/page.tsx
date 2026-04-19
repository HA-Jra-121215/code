"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DataPoint {
  year: string;
  amount: number;
  change: string;
}

interface Metrics {
  val: string;
  lastYr: string;
  last3Y: string;
  next3Y: string;
  trend: string;
}

interface Dataset {
  title: string;
  subtitle: string;
  data: DataPoint[];
  metrics: Metrics;
}

type DatasetKey = "ebitda" | "revenue" | "earnings";
type ViewMode = "chart" | "table" | "grid";
type Theme = "green" | "blue";

// ─── Data ────────────────────────────────────────────────────────────────────
const datasets: Record<DatasetKey, Dataset> = {
  ebitda: {
    title: "Annual EBITDA",
    subtitle: "Annual EBITDA Projected To Reach $337B By 2030",
    data: [
      { year: "2014", amount: 34.1, change: "+8%" },
      { year: "2015", amount: 31.6, change: "-7%" },
      { year: "2016", amount: 27.5, change: "-13%" },
      { year: "2017", amount: 34.1, change: "+24%" },
      { year: "2018", amount: 46.0, change: "+35%" },
      { year: "2019", amount: 53.5, change: "+16%" },
      { year: "2020", amount: 69.9, change: "+31%" },
      { year: "2021", amount: 85.6, change: "+22%" },
      { year: "2022", amount: 100.0, change: "+17%" },
      { year: "2023", amount: 105.0, change: "+5%" },
      { year: "2024", amount: 133.0, change: "+27%" },
      { year: "2025", amount: 160.0, change: "+20%" },
      { year: "2026", amount: 172.0, change: "+8%" },
      { year: "2027", amount: 198.0, change: "+15%" },
      { year: "2028", amount: 231.0, change: "+17%" },
      { year: "2029", amount: 273.0, change: "+18%" },
      { year: "2030", amount: 337.0, change: "+23%" },
    ],
    metrics: {
      val: "$172B",
      lastYr: "+8%",
      last3Y: "+18%",
      next3Y: "+17%",
      trend: "Strong Growth",
    },
  },
  revenue: {
    title: "Annual Revenue",
    subtitle: "Annual Revenue Projected To Reach $1100B By 2030",
    data: [
      { year: "2014", amount: 120, change: "+8%" },
      { year: "2015", amount: 140, change: "+17%" },
      { year: "2016", amount: 165, change: "+18%" },
      { year: "2017", amount: 190, change: "+15%" },
      { year: "2018", amount: 230, change: "+21%" },
      { year: "2019", amount: 280, change: "+22%" },
      { year: "2020", amount: 310, change: "+11%" },
      { year: "2021", amount: 350, change: "+13%" },
      { year: "2022", amount: 410, change: "+17%" },
      { year: "2023", amount: 460, change: "+12%" },
      { year: "2024", amount: 520, change: "+13%" },
      { year: "2025", amount: 610, change: "+17%" },
      { year: "2026", amount: 680, change: "+11%" },
      { year: "2027", amount: 750, change: "+10%" },
      { year: "2028", amount: 840, change: "+12%" },
      { year: "2029", amount: 950, change: "+13%" },
      { year: "2030", amount: 1100, change: "+16%" },
    ],
    metrics: {
      val: "$680B",
      lastYr: "+12%",
      last3Y: "+22%",
      next3Y: "+15%",
      trend: "Rapid Expansion",
    },
  },
  earnings: {
    title: "Annual Earnings",
    subtitle: "Annual Earnings Projected To Reach $240B By 2030",
    data: [
      { year: "2014", amount: 10, change: "+8%" },
      { year: "2015", amount: 12, change: "+20%" },
      { year: "2016", amount: 9, change: "-25%" },
      { year: "2017", amount: 14, change: "+56%" },
      { year: "2018", amount: 18, change: "+29%" },
      { year: "2019", amount: 22, change: "+22%" },
      { year: "2020", amount: 28, change: "+27%" },
      { year: "2021", amount: 35, change: "+25%" },
      { year: "2022", amount: 42, change: "+20%" },
      { year: "2023", amount: 50, change: "+19%" },
      { year: "2024", amount: 65, change: "+30%" },
      { year: "2025", amount: 80, change: "+23%" },
      { year: "2026", amount: 95, change: "+19%" },
      { year: "2027", amount: 115, change: "+21%" },
      { year: "2028", amount: 140, change: "+22%" },
      { year: "2029", amount: 180, change: "+29%" },
      { year: "2030", amount: 240, change: "+33%" },
    ],
    metrics: {
      val: "$95B",
      lastYr: "+15%",
      last3Y: "+14%",
      next3Y: "+20%",
      trend: "High Profitability",
    },
  },
};

const FUTURE_START = 2027;

// ─── Colour helpers ───────────────────────────────────────────────────────────
function getColors(theme: Theme) {
  return theme === "green"
    ? {
        past: "#4ade80",
        future: "#22c55e",
        shade: "#dcfce7",
        line: "#22c55e",
        btn: "#22c55e",
      }
    : {
        past: "#60a5fa",
        future: "#3b82f6",
        shade: "#eff6ff",
        line: "#3b82f6",
        btn: "#3b82f6",
      };
}

// ─── Mini Chart for Grid View ────────────────────────────────────────────────
function MiniChart({
  data,
  title,
  color,
}: {
  data: DataPoint[];
  title: string;
  color: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 280,
      height = 180;
    const margin = { top: 25, right: 10, bottom: 20, left: 30 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.year))
      .range([0, innerW])
      .padding(0.3);

    const yMax = d3.max(data, (d) => d.amount) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([0, yMax * 1.1])
      .range([innerH, 0]);

    // Bars
    g.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.year)!)
      .attr("y", (d) => y(d.amount))
      .attr("width", x.bandwidth())
      .attr("height", (d) => innerH - y(d.amount))
      .attr("fill", color)
      .attr("rx", 2);

    // X axis (only every 3rd year)
    const displayedYears = data
      .filter((_, i) => i % 3 === 0)
      .map((d) => d.year);
    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(displayedYears)
          .tickSize(0)
          .tickFormat((d) => d as string)
      )
      .style("font-size", "8px")
      .select(".domain")
      .remove();

    // Y axis
    g.append("g")
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickFormat((d) => `$${d}B`)
          .tickSize(0)
      )
      .style("font-size", "8px")
      .select(".domain")
      .remove();

    // Title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 12)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .style("fill", "#1e293b")
      .text(title);
  }, [data, color, title]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="180"
      viewBox="0 0 280 180"
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
function DataTable({ data }: { data: DataPoint[] }) {
  if (!data.length)
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
        No data
      </div>
    );
  return (
    <div
      style={{
        overflowX: "auto",
        marginTop: 20,
        borderRadius: 16,
        border: "1px solid #f1f5f9",
        background: "#fff",
      }}
    >
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
      >
        <thead
          style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
        >
          <tr>
            {["Year", "Amount ($B)", "YoY Change"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "12px 16px",
                  textAlign: h === "Year" ? "left" : "right",
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.year}
              style={{
                borderBottom:
                  i !== data.length - 1 ? "1px solid #f1f5f9" : "none",
                background:
                  parseInt(row.year) >= FUTURE_START
                    ? "rgba(220,252,231,0.15)"
                    : "transparent",
              }}
            >
              <td style={{ padding: "10px 16px", color: "#475569" }}>
                {row.year}
              </td>
              <td
                style={{
                  padding: "10px 16px",
                  textAlign: "right",
                  fontWeight: 500,
                }}
              >
                ${row.amount}B
              </td>
              <td
                style={{
                  padding: "10px 16px",
                  textAlign: "right",
                  color: row.change.startsWith("+") ? "#22c55e" : "#ef4444",
                  fontWeight: 600,
                }}
              >
                {row.change}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DatasetKey>("ebitda");
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const [showRange, setShowRange] = useState(false);
  const [rangeMin, setRangeMin] = useState(2014);
  const [rangeMax, setRangeMax] = useState(2030);
  const [theme, setTheme] = useState<Theme>("green");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings toggles
  const [showLabels, setShowLabels] = useState(true);
  const [showPercentChanges, setShowPercentChanges] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const chartRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = datasets[activeTab];
  const allYears = current.data.map((d) => parseInt(d.year));
  const minYearAll = Math.min(...allYears);
  const maxYearAll = Math.max(...allYears);

  const filteredData = current.data.filter((d) => {
    const y = parseInt(d.year);
    return y >= rangeMin && y <= rangeMax;
  });

  // ── Playback ──────────────────────────────────────────────────────────────
  const stopPlayback = useCallback(() => {
    if (playRef.current) {
      clearInterval(playRef.current);
      playRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    if (rangeMax >= maxYearAll) {
      setRangeMin(minYearAll);
      setRangeMax(minYearAll);
    }
    setIsPlaying(true);
    playRef.current = setInterval(() => {
      setRangeMax((prev) => {
        if (prev >= maxYearAll) {
          stopPlayback();
          return maxYearAll;
        }
        return prev + 1;
      });
    }, 300);
  }, [isPlaying, rangeMax, maxYearAll, minYearAll, stopPlayback]);

  // Reset on tab change
 const resetRange = useCallback(() => {
  const ys = datasets[activeTab].data.map((d) => parseInt(d.year));
  setRangeMin(Math.min(...ys));
  setRangeMax(Math.max(...ys));
}, [activeTab]);
  // ── D3 Chart ─────────────────────────────────────────────────────────────
  const drawChart = useCallback(() => {
    if (!chartRef.current || !containerRef.current || viewMode !== "chart")
      return;

    const width = containerRef.current.clientWidth;
    const height = 400;
    const margin = { top: 50, right: 80, bottom: 40, left: 20 };
    const innerW = Math.max(width - margin.left - margin.right, 300);
    const innerH = height - margin.top - margin.bottom;
    const colors = getColors(theme);

    const svg = d3.select(chartRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    if (!filteredData.length) {
      g.append("text")
        .attr("x", innerW / 2)
        .attr("y", innerH / 2)
        .attr("text-anchor", "middle")
        .style("fill", "#94a3b8")
        .text("No data for selected range");
      return;
    }

    // Scales
    const x = d3
      .scaleBand()
      .domain(filteredData.map((d) => d.year))
      .range([0, innerW])
      .padding(0.45);

    const yMax = (d3.max(filteredData, (d) => d.amount) ?? 0) * 1.15;
    const y = d3.scaleLinear().domain([0, yMax]).range([innerH, 0]);
    const yTicks = y.ticks(6);

    // Horizontal grid lines (darker)
    if (showGrid) {
      g.selectAll<SVGLineElement, number>(".h-grid")
        .data(yTicks)
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", innerW)
        .attr("y1", (d) => y(d))
        .attr("y2", (d) => y(d))
        .attr("stroke", "#cbd5e1")
        .attr("stroke-dasharray", "4,4")
        .attr("stroke-width", 1);

      // Vertical grid lines
      g.selectAll<SVGLineElement, DataPoint>(".v-grid")
        .data(filteredData)
        .enter()
        .append("line")
        .attr("x1", (d) => (x(d.year) ?? 0) + x.bandwidth() / 2)
        .attr("x2", (d) => (x(d.year) ?? 0) + x.bandwidth() / 2)
        .attr("y1", 0)
        .attr("y2", innerH)
        .attr("stroke", "#cbd5e1")
        .attr("stroke-dasharray", "4,4")
        .attr("stroke-width", 1);
    }

    // Future shading
    const futureYear = filteredData.find((d) => parseInt(d.year) >= FUTURE_START);
    const splitX = futureYear ? (x(futureYear.year) ?? innerW) : innerW;

    if (futureYear) {
      g.append("rect")
        .attr("x", splitX)
        .attr("y", -30)
        .attr("width", innerW - splitX)
        .attr("height", innerH + 30)
        .attr("fill", colors.shade)
        .attr("opacity", 0.7);

      g.append("line")
        .attr("x1", splitX)
        .attr("y1", -30)
        .attr("x2", splitX)
        .attr("y2", innerH)
        .attr("stroke", colors.line)
        .attr("stroke-width", 2);

      g.append("text")
        .attr("x", splitX - 10)
        .attr("y", -10)
        .attr("text-anchor", "end")
        .style("font-size", "11px")
        .style("fill", "#64748b")
        .style("font-weight", "500")
        .text("Past");
      g.append("text")
        .attr("x", splitX + 10)
        .attr("y", -10)
        .attr("text-anchor", "start")
        .style("font-size", "11px")
        .style("fill", "#64748b")
        .style("font-weight", "500")
        .text("Future");
    }

    // Bars with enter animation
    g.selectAll<SVGRectElement, DataPoint>(".bar")
      .data(filteredData)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.year) ?? 0)
      .attr("y", innerH)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", (d) =>
        parseInt(d.year) >= FUTURE_START ? colors.future : colors.past
      )
      .attr("rx", 3)
      .attr("class", "bar")
      .transition()
      .duration(500)
      .attr("y", (d) => y(d.amount))
      .attr("height", (d) => innerH - y(d.amount));

    // Amount labels above bars
    if (showLabels) {
      g.selectAll<SVGTextElement, DataPoint>(".bar-label-amount")
        .data(filteredData)
        .enter()
        .append("text")
        .attr("x", (d) => (x(d.year) ?? 0) + x.bandwidth() / 2)
        .attr("y", (d) => y(d.amount) - 12)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "#1e293b")
        .style("font-weight", "600")
        .style("opacity", 0)
        .text((d) => `$${d.amount}B`)
        .transition()
        .duration(500)
        .style("opacity", 1);
    }

    // YoY change labels
    if (showPercentChanges) {
      g.selectAll<SVGTextElement, DataPoint>(".bar-label-change")
        .data(filteredData)
        .enter()
        .append("text")
        .attr("x", (d) => (x(d.year) ?? 0) + x.bandwidth() / 2)
        .attr("y", (d) => y(d.amount) - 2)
        .attr("text-anchor", "middle")
        .style("font-size", "9px")
        .style("fill", (d) =>
          d.change.startsWith("+") ? "#22c55e" : "#ef4444"
        )
        .style("font-weight", "500")
        .style("opacity", 0)
        .text((d) => d.change)
        .transition()
        .duration(500)
        .style("opacity", 1);
    }

    // Crosshair lines (vertical and horizontal)
    const vLine = g.append("line")
      .attr("y1", -20)
      .attr("y2", innerH)
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .style("opacity", 0);

    const hLine = g.append("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .style("opacity", 0);

    // Overlay for hover detection (full chart area)
    const overlay = g.append("rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "transparent")
      .style("cursor", showTooltip ? "crosshair" : "default");

    if (showTooltip) {
      overlay
        .on("mousemove", (event: MouseEvent) => {
          const [mouseX, mouseY] = d3.pointer(event);
          
          // Update crosshair at cursor position
          vLine.attr("x1", mouseX).attr("x2", mouseX).style("opacity", 1);
          hLine.attr("y1", mouseY).attr("y2", mouseY).style("opacity", 1);

          // Find nearest bar based on X
          const step = x.step();
          const index = Math.min(
            Math.max(0, Math.floor(mouseX / step)),
            filteredData.length - 1
          );
          const d = filteredData[index];
          if (!d) return;

          if (tooltipRef.current) {
            tooltipRef.current.style.opacity = "1";
            tooltipRef.current.style.left = `${event.pageX + 15}px`;
            tooltipRef.current.style.top = `${event.pageY - 40}px`;
            tooltipRef.current.style.transform = "none"; // remove any centering
            tooltipRef.current.innerHTML = `<strong>${d.year}</strong><br/>$${d.amount}B<br/><span style="color:${
              d.change.startsWith("+") ? "#22c55e" : "#ef4444"
            }">${d.change}</span>`;
          }
        })
        .on("mouseleave", () => {
          vLine.style("opacity", 0);
          hLine.style("opacity", 0);
          if (tooltipRef.current) {
            tooltipRef.current.style.opacity = "0";
          }
        });
    }

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .style("fill", "#94a3b8")
      .style("font-size", "10px");

    // Y axis (right side)
    svg
      .append("g")
      .attr("transform", `translate(${margin.left + innerW + 5},${margin.top})`)
      .call(
        d3
          .axisRight(y)
          .tickValues(yTicks)
          .tickFormat((d) => `$${d}B`)
          .tickSize(0)
      )
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .style("fill", "#cbd5e1")
      .style("font-size", "11px");

  }, [filteredData, viewMode, theme, showLabels, showPercentChanges, showTooltip, showGrid]);

  // Redraw on resize
  useEffect(() => {
    if (viewMode !== "chart") return;
    drawChart();
    const ro = new ResizeObserver(() => drawChart());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", drawChart);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", drawChart);
    };
  }, [drawChart, viewMode]);

  useEffect(() => {
    if (viewMode === "chart") drawChart();
  }, [filteredData, theme, drawChart, viewMode, showLabels, showPercentChanges, showTooltip, showGrid]);

  // ── Tab navigation order ─────────────────────────────────────────────────
  const tabOrder: DatasetKey[] = ["revenue", "ebitda", "earnings"];
  const curIdx = tabOrder.indexOf(activeTab);
  const prevTab = curIdx > 0 ? tabOrder[curIdx - 1] : null;
  const nextTab = curIdx < tabOrder.length - 1 ? tabOrder[curIdx + 1] : null;

 const navigate = (tab: DatasetKey | null) => {
  if (!tab) return;

  // ✅ calculate range BEFORE setting tab
  const ys = datasets[tab].data.map((d) => parseInt(d.year));

  setActiveTab(tab);
  setRangeMin(Math.min(...ys));
  setRangeMax(Math.max(...ys));

  setViewMode("chart");
  stopPlayback();
  setShowRange(false);
  setShowSettings(false);
};

  const colors = getColors(theme);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: "#fff",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "15px 24px",
        }}
      >
        {/* Navbar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: 10,
            fontSize: 14,
            color: "#64748b",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {/* Many Charts button */}
            <button
              onClick={() => setViewMode("grid")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: 0,
                fontSize: 14,
                color: "#64748b",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="0" y="0" width="6" height="6" fill="#3b82f6" rx="1" />
                <rect x="8" y="0" width="6" height="6" fill="#ef4444" rx="1" />
                <rect x="0" y="8" width="6" height="6" fill="#22c55e" rx="1" />
                <rect x="8" y="8" width="6" height="6" fill="#f59e0b" rx="1" />
              </svg>
              Many Charts
            </button>
            <span
              style={{
                color: "#f59e0b",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: 6,
                borderBottom: "2px solid #f59e0b",
                paddingBottom: 10,
                marginBottom: -11,
              }}
            >
              ⚡ Analysis
            </span>
          </div>
        </div>

        {/* Header + Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginTop: 20,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "clamp(20px,4vw,28px)",
                fontWeight: 900,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#0f172a",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                }}
              >
                {(
                  ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"] as const
                ).map((c, i) => (
                  <div
                    key={i}
                    style={{ width: 9, height: 9, background: c, borderRadius: 1 }}
                  />
                ))}
              </div>
              {current.title}
              <span
                style={{ fontSize: 14, color: "#94a3b8", fontWeight: 400 }}
              >
                ▾
              </span>
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "4px 0 0" }}>
              {current.subtitle}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#f8fafc",
              padding: "6px 14px",
              borderRadius: 10,
              border: "1px solid #f1f5f9",
              flexWrap: "wrap",
            }}
          >
            {(["chart", "table"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setViewMode(m);
                  if (m !== "chart") stopPlayback();
                }}
                style={{
                  background: viewMode === m ? colors.btn : "transparent",
                  color: viewMode === m ? "#fff" : "#334155",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {m === "chart" ? "📊 Bars" : "田 Table"}
              </button>
            ))}
            <button
              onClick={() => {
                setShowRange(!showRange);
                setShowSettings(false);
              }}
              style={{
                background: "#f1f5f9",
                border: "none",
                padding: "6px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              📅 Range
            </button>
            <button
              onClick={startPlayback}
              style={{
                background: isPlaying ? "#ef4444" : "#f1f5f9",
                color: isPlaying ? "#fff" : "#334155",
                border: "none",
                padding: "6px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {isPlaying ? "⏸ Stop" : "▶ Play"}
            </button>
            <button
              onClick={() => {
                setShowSettings(!showSettings);
                setShowRange(false);
              }}
              style={{
                background: "#f1f5f9",
                border: "none",
                padding: "6px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 18,
                lineHeight: "1",
              }}
            >
              ⋮
            </button>
          </div>
        </div>

        {/* Chart / Table / Grid area */}
        <div
          ref={containerRef}
          style={{ position: "relative", marginTop: 30 }}
        >
          {/* Metrics card (only visible in chart view) */}
          {viewMode === "chart" && (
            <div
              style={{
                position: "absolute",
                left: 16,
                top: 10,
                zIndex: 10,
                background: "rgba(255,255,255,0.97)",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #f1f5f9",
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                width: "min(260px,85%)",
                backdropFilter: "blur(4px)",
              }}
            >
              {[
                {
                  icon: "📊",
                  label: current.title,
                  val: current.metrics.val,
                  color: "#0f172a",
                },
                {
                  icon: "📈",
                  label: "Last Year Growth",
                  val: current.metrics.lastYr,
                  color: "#22c55e",
                },
                {
                  icon: "📈",
                  label: "Last 3 Years Avg",
                  val: current.metrics.last3Y,
                  color: "#22c55e",
                },
                {
                  icon: "⭐",
                  label: "Next 3 Years Avg",
                  val: current.metrics.next3Y,
                  color: "#22c55e",
                },
              ].map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: i < 3 ? 10 : 0,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "#475569" }}>
                    {row.icon} {row.label}
                  </span>
                  <span style={{ fontWeight: 800, color: row.color }}>
                    {row.val}
                  </span>
                </div>
              ))}
              <div
                style={{
                  borderTop: "1px solid #f1f5f9",
                  marginTop: 12,
                  paddingTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "#ef4444" }}>⚠️ Trend</span>
                <span style={{ color: "#22c55e", fontWeight: 900 }}>
                  {current.metrics.trend}
                </span>
              </div>
            </div>
          )}

          {/* Tooltip */}
          <div
            ref={tooltipRef}
            style={{
              position: "fixed",
              background: "#fff",
              padding: "8px 12px",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              pointerEvents: "none",
              opacity: 0,
              border: "1px solid #e2e8f0",
              zIndex: 100,
              fontSize: 12,
              transition: "opacity 0.1s",
              whiteSpace: "nowrap",
            }}
          />

          {viewMode === "chart" && (
            <svg ref={chartRef} style={{ width: "100%", minHeight: 400 }} />
          )}
          {viewMode === "table" && (
            <div style={{ paddingTop: 8 }}>
              <DataTable data={filteredData} />
            </div>
          )}
          {viewMode === "grid" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 20,
                marginTop: 10,
              }}
            >
              {Object.entries(datasets).map(([key, ds]) => (
                <div
                  key={key}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: "1px solid #f1f5f9",
                    padding: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  <MiniChart
                    data={ds.data}
                    title={ds.title}
                    color={getColors(theme).past}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Range panel */}
        {showRange && (
          <div
            style={{
              position: "absolute",
              top: 130,
              right: 24,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
              zIndex: 30,
              width: 260,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
              Filter by Year
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#475569" }}>From: </label>
              <select
                value={rangeMin}
                onChange={(e) => {
                  setRangeMin(parseInt(e.target.value));
                  stopPlayback();
                }}
                style={{
                  marginLeft: 8,
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                }}
              >
                {allYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: "#475569" }}>To: </label>
              <select
                value={rangeMax}
                onChange={(e) => {
                  setRangeMax(parseInt(e.target.value));
                  stopPlayback();
                }}
                style={{
                  marginLeft: 8,
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                }}
              >
                {allYears
                  .filter((y) => y >= rangeMin)
                  .map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
              </select>
            </div>
            <button
              onClick={() => {
                setRangeMin(minYearAll);
                setRangeMax(maxYearAll);
                stopPlayback();
              }}
              style={{
                background: "#f1f5f9",
                border: "none",
                padding: "6px 12px",
                borderRadius: 6,
                cursor: "pointer",
                width: "100%",
                fontSize: 13,
              }}
            >
              Reset Range
            </button>
          </div>
        )}

        {/* Settings panel */}
        {showSettings && (
          <div
            style={{
              position: "absolute",
              top: 130,
              right: 24,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
              zIndex: 30,
              width: 260,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>
              Chart Settings
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
              />
              <span style={{ fontSize: 13 }}>Show Labels</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showPercentChanges}
                onChange={(e) => setShowPercentChanges(e.target.checked)}
              />
              <span style={{ fontSize: 13 }}>Show % Changes</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showTooltip}
                onChange={(e) => setShowTooltip(e.target.checked)}
              />
              <span style={{ fontSize: 13 }}>Show Tooltip</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              <span style={{ fontSize: 13 }}>Grid</span>
            </label>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, marginBottom: 6, color: "#475569" }}>Color</div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  background: "#fff",
                }}
              >
                <option value="green">Green</option>
                <option value="blue">Blue</option>
              </select>
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 20,
            marginTop: 40,
            flexWrap: "wrap",
          }}
        >
          {/* Back button – div role="button" for 100% static appearance */}
          <div
            onClick={() => prevTab && navigate(prevTab)}
            role="button"
            tabIndex={prevTab ? 0 : -1}
            aria-disabled={!prevTab}
            style={{
              width: 280,
              padding: "14px 20px",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              cursor: prevTab ? "pointer" : "default",
              background: "#ffffff",
              opacity: prevTab ? 1 : 0.4,
              transition: "none",
              WebkitTapHighlightColor: "transparent",
              userSelect: "none",
              outline: "none",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#94a3b8", fontSize: 18 }}>{"<"}</span>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    marginBottom: 2,
                    letterSpacing: "0.05em",
                  }}
                >
                  Back
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>
                  {prevTab ? datasets[prevTab].title : "—"}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {prevTab === "revenue"
                    ? "Is the business growing fast?"
                    : prevTab === "ebitda"
                    ? "Operational profitability metric"
                    : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Next button – div role="button" for 100% static appearance */}
          <div
            onClick={() => nextTab && navigate(nextTab)}
            role="button"
            tabIndex={nextTab ? 0 : -1}
            aria-disabled={!nextTab}
            style={{
              width: 280,
              padding: "14px 20px",
              background: nextTab ? colors.btn : "#e2e8f0",
              border: `1px solid ${nextTab ? colors.btn : "#e2e8f0"}`,
              color: "#fff",
              borderRadius: 12,
              cursor: nextTab ? "pointer" : "default",
              opacity: nextTab ? 1 : 0.5,
              transition: "none",
              WebkitTapHighlightColor: "transparent",
              userSelect: "none",
              outline: "none",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.8,
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Next
                </div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>
                  {nextTab ? datasets[nextTab].title : "—"}
                </div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>
                  {nextTab === "earnings"
                    ? "What is the real profit?"
                    : nextTab === "ebitda"
                    ? "Operational profitability"
                    : ""}
                </div>
              </div>
              <span style={{ fontSize: 20 }}>{">"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}