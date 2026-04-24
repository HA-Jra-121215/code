"use client";

import { useEffect, useRef, useState, useCallback } from "react";

let d3: any = null;
let HexColorPicker: any = null;

import("d3").then((mod) => { d3 = mod; });
import("react-colorful").then((mod) => { HexColorPicker = mod.HexColorPicker; });

// ------------------------ Types & Data ------------------------
interface DataPoint { year: string; amount: number; change: string; }
interface Metrics { val: string; lastYr: string; last3Y: string; next3Y: string; trend: string; }
interface Dataset { title: string; subtitle: string; data: DataPoint[]; metrics: Metrics; }
type DatasetKey = "ebitda" | "revenue" | "earnings";
type ViewMode = "chart" | "table" | "grid";

const datasets: Record<DatasetKey, Dataset> = {
  ebitda: { title: "Annual EBITDA", subtitle: "Annual EBITDA Projected To Reach $337B By 2030", data: [{ year: "2014", amount: 34.1, change: "+8%" }, { year: "2015", amount: 31.6, change: "-7%" }, { year: "2016", amount: 27.5, change: "-13%" }, { year: "2017", amount: 34.1, change: "+24%" }, { year: "2018", amount: 46.0, change: "+35%" }, { year: "2019", amount: 53.5, change: "+16%" }, { year: "2020", amount: 69.9, change: "+31%" }, { year: "2021", amount: 85.6, change: "+22%" }, { year: "2022", amount: 100.0, change: "+17%" }, { year: "2023", amount: 105.0, change: "+5%" }, { year: "2024", amount: 133.0, change: "+27%" }, { year: "2025", amount: 160.0, change: "+20%" }, { year: "2026", amount: 172.0, change: "+8%" }, { year: "2027", amount: 198.0, change: "+15%" }, { year: "2028", amount: 231.0, change: "+17%" }, { year: "2029", amount: 273.0, change: "+18%" }, { year: "2030", amount: 337.0, change: "+23%" }], metrics: { val: "$172B", lastYr: "+8%", last3Y: "+18%", next3Y: "+17%", trend: "Strong Growth" } },
  revenue: { title: "Annual Revenue", subtitle: "Annual Revenue Projected To Reach $1100B By 2030", data: [{ year: "2014", amount: 120, change: "+8%" }, { year: "2015", amount: 140, change: "+17%" }, { year: "2016", amount: 165, change: "+18%" }, { year: "2017", amount: 190, change: "+15%" }, { year: "2018", amount: 230, change: "+21%" }, { year: "2019", amount: 280, change: "+22%" }, { year: "2020", amount: 310, change: "+11%" }, { year: "2021", amount: 350, change: "+13%" }, { year: "2022", amount: 410, change: "+17%" }, { year: "2023", amount: 460, change: "+12%" }, { year: "2024", amount: 520, change: "+13%" }, { year: "2025", amount: 610, change: "+17%" }, { year: "2026", amount: 680, change: "+11%" }, { year: "2027", amount: 750, change: "+10%" }, { year: "2028", amount: 840, change: "+12%" }, { year: "2029", amount: 950, change: "+13%" }, { year: "2030", amount: 1100, change: "+16%" }], metrics: { val: "$680B", lastYr: "+12%", last3Y: "+22%", next3Y: "+15%", trend: "Rapid Expansion" } },
  earnings: { title: "Annual Earnings", subtitle: "Annual Earnings Projected To Reach $240B By 2030", data: [{ year: "2014", amount: 10, change: "+8%" }, { year: "2015", amount: 12, change: "+20%" }, { year: "2016", amount: 9, change: "-25%" }, { year: "2017", amount: 14, change: "+56%" }, { year: "2018", amount: 18, change: "+29%" }, { year: "2019", amount: 22, change: "+22%" }, { year: "2020", amount: 28, change: "+27%" }, { year: "2021", amount: 35, change: "+25%" }, { year: "2022", amount: 42, change: "+20%" }, { year: "2023", amount: 50, change: "+19%" }, { year: "2024", amount: 65, change: "+30%" }, { year: "2025", amount: 80, change: "+23%" }, { year: "2026", amount: 95, change: "+19%" }, { year: "2027", amount: 115, change: "+21%" }, { year: "2028", amount: 140, change: "+22%" }, { year: "2029", amount: 180, change: "+29%" }, { year: "2030", amount: 240, change: "+33%" }], metrics: { val: "$95B", lastYr: "+15%", last3Y: "+14%", next3Y: "+20%", trend: "High Profitability" } },
};

const FUTURE_START = 2027;

function lightenColor(hex: string, percent: number): string {
  let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  r = Math.min(255, Math.floor(r + (255 - r) * percent / 100));
  g = Math.min(255, Math.floor(g + (255 - g) * percent / 100));
  b = Math.min(255, Math.floor(b + (255 - b) * percent / 100));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// MiniChart component
function MiniChart({ data, title, color }: { data: DataPoint[]; title: string; color: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!svgRef.current || !d3) return;
    const d3Lib = d3, svg = d3Lib.select(svgRef.current);
    svg.selectAll("*").remove();
    const width = 280, height = 180, margin = { top: 25, right: 10, bottom: 20, left: 30 };
    const innerW = width - margin.left - margin.right, innerH = height - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3Lib.scaleBand().domain(data.map((d: DataPoint) => d.year)).range([0, innerW]).padding(0.3);
    const yMax = d3Lib.max(data, (d: DataPoint) => d.amount) ?? 0;
    const y = d3Lib.scaleLinear().domain([0, yMax * 1.1]).range([innerH, 0]);
    g.selectAll("rect").data(data).enter().append("rect")
      .attr("x", (d: DataPoint) => x(d.year)!)
      .attr("y", (d: DataPoint) => y(d.amount))
      .attr("width", x.bandwidth())
      .attr("height", (d: DataPoint) => innerH - y(d.amount))
      .attr("fill", color)
      .attr("rx", 2);
    const displayedYears = data.filter((_: DataPoint, i: number) => i % 3 === 0).map((d: DataPoint) => d.year);
    g.append("g").attr("transform", `translate(0,${innerH})`)
      .call(d3Lib.axisBottom(x).tickValues(displayedYears).tickSize(0))
      .style("font-size", "8px").select(".domain").remove();
    g.append("g").call(d3Lib.axisLeft(y).ticks(4).tickFormat((d: number) => `$${d}B`).tickSize(0))
      .style("font-size", "8px").select(".domain").remove();
    svg.append("text").attr("x", width / 2).attr("y", 12).attr("text-anchor", "middle")
      .style("font-size", "11px").style("font-weight", "bold").style("fill", "#1e293b").text(title);
  }, [data, color, title]);
  return <svg ref={svgRef} width="100%" height="180" viewBox="0 0 280 180" preserveAspectRatio="xMidYMid meet" />;
}

// DataTable component
function DataTable({ data }: { data: DataPoint[] }) {
  return (
    <div style={{ overflowX: "auto", marginTop: 20, borderRadius: 16, border: "1px solid #f1f5f9", background: "#fff" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <tr>
            {["Year", "Amount ($B)", "YoY Change"].map((h) => (
              <th key={h} style={{ padding: "12px 16px", textAlign: h === "Year" ? "left" : "right", fontWeight: 600, color: "#334155" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.year} style={{ borderBottom: i !== data.length - 1 ? "1px solid #f1f5f9" : "none", background: parseInt(row.year) >= FUTURE_START ? "rgba(220,252,231,0.15)" : "transparent" }}>
              <td style={{ padding: "10px 16px", color: "#475569" }}>{row.year}</td>
              <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 500 }}>${row.amount}B</td>
              <td style={{ padding: "10px 16px", textAlign: "right", color: row.change.startsWith("+") ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{row.change}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DatasetKey>("ebitda");
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const [showSettings, setShowSettings] = useState(false);
  const [showColorPickerMode, setShowColorPickerMode] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showPercentChanges, setShowPercentChanges] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [customColor, setCustomColor] = useState("#22c55e");
  const [alpha, setAlpha] = useState(100);
  const [rgb, setRgb] = useState({ r: 34, g: 197, b: 94 });
  const [d3Loaded, setD3Loaded] = useState(false);

  const chartRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const current = datasets[activeTab];
  const filteredData = current.data;

  useEffect(() => {
    Promise.all([import("d3"), import("react-colorful")]).then(([d3Module, colorModule]) => {
      d3 = d3Module;
      HexColorPicker = colorModule.HexColorPicker;
      setD3Loaded(true);
    });
  }, []);

  const hexToRgb = (hex: string) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 0, g: 0, b: 0 };
  };
  useEffect(() => { setRgb(hexToRgb(customColor)); }, [customColor]);

  const drawChart = useCallback(() => {
    if (!chartRef.current || !containerRef.current || viewMode !== "chart" || !d3Loaded) return;
    const d3Lib = d3, width = containerRef.current.clientWidth, height = 400, margin = { top: 50, right: 80, bottom: 40, left: 20 };
    const innerW = Math.max(width - margin.left - margin.right, 300), innerH = height - margin.top - margin.bottom;
    const svg = d3Lib.select(chartRef.current); svg.selectAll("*").remove(); svg.attr("width", width).attr("height", height);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const data = filteredData; if (!data.length) return;
    const x = d3Lib.scaleBand().domain(data.map((d: DataPoint) => d.year)).range([0, innerW]).padding(0.45);
    const yMax = (d3Lib.max(data, (d: DataPoint) => d.amount) ?? 0) * 1.15;
    const y = d3Lib.scaleLinear().domain([0, yMax]).range([innerH, 0]);
    const yTicks = y.ticks(6);
    const secondHighestTick = yTicks.length >= 2 ? yTicks[yTicks.length - 2] : null;
    const pastColor = customColor, futureColor = lightenColor(customColor, 40), shadeColor = lightenColor(customColor, 70);
    
    if (showGrid) {
      g.selectAll(".h-grid").data(yTicks).enter().append("line")
        .attr("x1", 0).attr("x2", innerW).attr("y1", (d: number) => y(d)).attr("y2", (d: number) => y(d))
        .attr("stroke", "#e2e8f0").attr("stroke-width", 1).attr("stroke-dasharray", "4,4");
      g.selectAll(".v-grid").data(data).enter().append("line")
        .attr("x1", (d: DataPoint) => (x(d.year) ?? 0) + x.bandwidth() / 2)
        .attr("x2", (d: DataPoint) => (x(d.year) ?? 0) + x.bandwidth() / 2)
        .attr("y1", 0).attr("y2", innerH)
        .attr("stroke", "#e2e8f0").attr("stroke-width", 1).attr("stroke-dasharray", "4,4");
    }
    
    const year2026 = data.find((d: DataPoint) => d.year === "2026");
    const year2027 = data.find((d: DataPoint) => d.year === "2027");
    let splitX: number | null = null;
    if (year2026 && year2027) {
      const x2026End = (x("2026") ?? 0) + x.bandwidth();
      const x2027Start = x("2027") ?? 0;
      splitX = (x2026End + x2027Start) / 2;
    } else if (year2027) {
      splitX = x("2027") ?? innerW;
    }
    if (splitX !== null) {
      g.append("rect").attr("x", splitX).attr("y", -30).attr("width", innerW - splitX).attr("height", innerH + 30)
        .attr("fill", shadeColor).attr("opacity", 0.45);
      g.append("line").attr("x1", splitX).attr("y1", -30).attr("x2", splitX).attr("y2", innerH)
        .attr("stroke", customColor).attr("stroke-width", 2).attr("stroke-dasharray", "6,4");
      g.append("text").attr("x", splitX - 12).attr("y", -12).attr("text-anchor", "end")
        .style("font-size", "11px").style("fill", "#64748b").style("font-weight", "500").text("Past");
      g.append("text").attr("x", splitX + 12).attr("y", -12).attr("text-anchor", "start")
        .style("font-size", "11px").style("fill", "#64748b").style("font-weight", "500").text("Future");
    }
    
    g.selectAll(".bar").data(data).enter().append("rect")
      .attr("x", (d: DataPoint) => x(d.year) ?? 0)
      .attr("y", innerH)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", (d: DataPoint) => (parseInt(d.year) >= FUTURE_START ? futureColor : pastColor))
      .attr("fill-opacity", (d: DataPoint) => (parseInt(d.year) >= FUTURE_START ? alpha / 100 : 1))
      .attr("rx", 3)
      .transition().duration(800)
      .attr("y", (d: DataPoint) => y(d.amount))
      .attr("height", (d: DataPoint) => innerH - y(d.amount));
    
    if (showLabels) {
      g.selectAll(".bar-label-amount").data(data).enter().append("text")
        .attr("x", (d: DataPoint) => (x(d.year) ?? 0) + x.bandwidth() / 2)
        .attr("y", (d: DataPoint) => y(d.amount) - 12)
        .attr("text-anchor", "middle")
        .style("font-size", "10px").style("fill", "#1e293b").style("font-weight", "600")
        .style("opacity", 0).text((d: DataPoint) => `$${d.amount}B`)
        .transition().duration(800).style("opacity", 1);
    }
    if (showPercentChanges) {
      g.selectAll(".bar-label-change").data(data).enter().append("text")
        .attr("x", (d: DataPoint) => (x(d.year) ?? 0) + x.bandwidth() / 2)
        .attr("y", (d: DataPoint) => y(d.amount) - 2)
        .attr("text-anchor", "middle")
        .style("font-size", "9px")
        .style("fill", (d: DataPoint) => d.change.startsWith("+") ? "#22c55e" : "#ef4444")
        .style("font-weight", "500")
        .style("opacity", 0).text((d: DataPoint) => d.change)
        .transition().duration(800).style("opacity", 1);
    }
    
    g.append("g").attr("transform", `translate(0,${innerH})`)
      .call(d3Lib.axisBottom(x).tickSize(0))
      .select(".domain").remove();
    g.selectAll(".tick text").style("fill", "#94a3b8").style("font-size", "10px");
    
    // Y-axis group (ticks and labels)
    const yAxisGroup = svg.append("g").attr("transform", `translate(${margin.left + innerW + 5},${margin.top})`)
      .call(d3Lib.axisRight(y).tickValues(yTicks).tickFormat((d: number) => `$${d}B`).tickSize(0))
      .select(".domain").remove();
    yAxisGroup.selectAll("text")
      .style("fill", (d: number) => (d === secondHighestTick ? "#fff" : "#cbd5e1"))
      .style("font-size", "11px")
      .style("font-weight", (d: number) => (d === secondHighestTick ? "bold" : "normal"))
      .style("paint-order", "stroke")
      .style("stroke", (d: number) => (d === secondHighestTick ? customColor : "none"))
      .style("stroke-width", (d: number) => (d === secondHighestTick ? "16px" : "0"))
      .style("stroke-linecap", "round")
      .attr("dx", (d: number) => (d === secondHighestTick ? "8" : "0"));
    
    // Y-axis line and top arrow
    const yAxisLineGroup = svg.append("g").attr("transform", `translate(${margin.left + innerW + 5},${margin.top})`);
    const yAxisTop = -margin.top;
    const yAxisBottom = innerH;
    yAxisLineGroup.append("line")
      .attr("x1", 0).attr("x2", 0)
      .attr("y1", yAxisTop).attr("y2", yAxisBottom)
      .attr("stroke", "#cbd5e1").attr("stroke-width", 1.5);
    yAxisLineGroup.append("path")
      .attr("d", `M -5 ${yAxisTop - 6} L 0 ${yAxisTop - 14} L 5 ${yAxisTop - 6}`)
      .attr("fill", "none").attr("stroke", "#cbd5e1").attr("stroke-width", 1.5)
      .attr("stroke-linecap", "round").attr("stroke-linejoin", "round");
    
    // X-axis line (no arrow)
    const xAxisLineGroup = svg.append("g").attr("transform", `translate(${margin.left},${margin.top + innerH})`);
    xAxisLineGroup.append("line").attr("x1", 0).attr("y1", 0).attr("x2", innerW).attr("y2", 0)
      .attr("stroke", "#cbd5e1").attr("stroke-width", 1.5);
    
    // Green circle + small arrow at the top Y‑axis tick (the highest value)
    const topTick = yTicks[yTicks.length - 1];
    const topTickY = y(topTick);
    yAxisGroup.append("circle")
      .attr("cx", 0).attr("cy", topTickY).attr("r", 5)
      .attr("fill", customColor).attr("stroke", "#fff").attr("stroke-width", 1);
    yAxisGroup.append("path")
      .attr("d", `M -10 ${topTickY - 5} L 0 ${topTickY - 12} L 10 ${topTickY - 5}`)
      .attr("fill", "none").attr("stroke", customColor).attr("stroke-width", 1.5)
      .attr("stroke-linecap", "round").attr("stroke-linejoin", "round");
    
    // Tooltip overlay
    const vLine = g.append("line").attr("y1", -20).attr("y2", innerH)
      .attr("stroke", "#94a3b8").attr("stroke-width", 1).attr("stroke-dasharray", "3,3").style("opacity", 0);
    const hLine = g.append("line").attr("x1", 0).attr("x2", innerW)
      .attr("stroke", "#94a3b8").attr("stroke-width", 1).attr("stroke-dasharray", "3,3").style("opacity", 0);
    const overlay = g.append("rect").attr("width", innerW).attr("height", innerH).attr("fill", "transparent")
      .style("cursor", showTooltip ? "crosshair" : "default");
    if (showTooltip) {
      overlay.on("mousemove", (event: MouseEvent) => {
        const [mouseX, mouseY] = d3Lib.pointer(event);
        vLine.attr("x1", mouseX).attr("x2", mouseX).style("opacity", 1);
        hLine.attr("y1", mouseY).attr("y2", mouseY).style("opacity", 1);
        let index = -1;
        for (let i = 0; i < data.length; i++) {
          const xPos = x(data[i].year);
          if (xPos !== undefined && mouseX >= xPos && mouseX <= xPos + x.bandwidth()) {
            index = i;
            break;
          }
        }
        if (index === -1) return;
        const d = data[index];
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = "1";
          tooltipRef.current.style.left = `${event.pageX + 15}px`;
          tooltipRef.current.style.top = `${event.pageY - 40}px`;
          tooltipRef.current.innerHTML = `<strong>${d.year}</strong><br/>$${d.amount}B<br/><span style="color:${d.change.startsWith("+") ? "#22c55e" : "#ef4444"}">${d.change}</span>`;
        }
      }).on("mouseleave", () => {
        vLine.style("opacity", 0);
        hLine.style("opacity", 0);
        if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
      });
    }
  }, [filteredData, viewMode, customColor, showLabels, showPercentChanges, showTooltip, showGrid, alpha, d3Loaded]);

  useEffect(() => {
    if (viewMode !== "chart" || !d3Loaded) return;
    drawChart();
    const ro = new ResizeObserver(() => drawChart());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [drawChart, viewMode, d3Loaded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
        setShowColorPickerMode(false);
      }
    };
    if (showSettings) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettings]);

  const navigate = (tab: DatasetKey | null) => {
    if (tab) {
      setActiveTab(tab);
      setViewMode("chart");
      setShowSettings(false);
      setShowColorPickerMode(false);
    }
  };
  const tabOrder: DatasetKey[] = ["revenue", "ebitda", "earnings"];
  const curIdx = tabOrder.indexOf(activeTab);
  const prevTab = curIdx > 0 ? tabOrder[curIdx - 1] : null;
  const nextTab = curIdx < tabOrder.length - 1 ? tabOrder[curIdx + 1] : null;
  const handleColorChange = (newColor: string) => {
    setCustomColor(newColor);
    setRgb(hexToRgb(newColor));
  };

  if (!d3Loaded) return <div style={{ padding: 40, textAlign: "center" }}>Loading dashboard...</div>;

  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px", position: "relative" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, borderBottom: "1px solid #e2e8f0", paddingBottom: 8, marginBottom: 24 }}>
          <button onClick={() => setViewMode("grid")} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 500, color: "#334155" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="0" y="0" width="7" height="7" fill="#3b82f6" rx="1" />
              <rect x="9" y="0" width="7" height="7" fill="#ef4444" rx="1" />
              <rect x="0" y="9" width="7" height="7" fill="#22c55e" rx="1" />
              <rect x="9" y="9" width="7" height="7" fill="#f59e0b" rx="1" />
            </svg>
            Many Charts
          </button>
          <span style={{ color: "#f59e0b", fontWeight: 500, fontSize: 14 }}>Analysis</span>
        </div>
        {/* Title bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 6, color: "#0f172a" }}>
            {current.title} <span style={{ fontSize: 16, color: "#94a3b8", fontWeight: 400 }}>▾</span>
          </h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => { setViewMode("chart"); setShowSettings(false); setShowColorPickerMode(false); }}
              style={{ background: viewMode === "chart" ? customColor : "transparent", color: viewMode === "chart" ? "#fff" : "#334155", border: `1px solid ${viewMode === "chart" ? customColor : "#e2e8f0"}`, padding: "6px 12px", borderRadius: 20, fontWeight: 500, cursor: "pointer", fontSize: 13 }}>
              📊 Bars
            </button>
            <button onClick={() => { setViewMode("table"); setShowSettings(false); setShowColorPickerMode(false); }}
              style={{ background: viewMode === "table" ? customColor : "transparent", color: viewMode === "table" ? "#fff" : "#334155", border: `1px solid ${viewMode === "table" ? customColor : "#e2e8f0"}`, padding: "6px 12px", borderRadius: 20, fontWeight: 500, cursor: "pointer", fontSize: 13 }}>
              田 Table
            </button>
            <button style={{ background: "transparent", color: "#334155", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: 20, fontWeight: 500, cursor: "pointer", fontSize: 13 }}>
              📅 Range
            </button>
            <button onClick={drawChart} style={{ background: "transparent", color: "#334155", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: 20, fontWeight: 500, cursor: "pointer", fontSize: 13 }}>
              ▶ Play
            </button>
            <button onClick={() => { setShowSettings(!showSettings); setShowColorPickerMode(false); }}
              style={{ background: showSettings ? customColor : "transparent", color: showSettings ? "#fff" : "#334155", border: `1px solid ${showSettings ? customColor : "#e2e8f0"}`, padding: "6px 12px", borderRadius: 20, fontWeight: 500, cursor: "pointer", fontSize: 13 }}>
              ⚙️ Settings
            </button>
          </div>
        </div>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>{current.subtitle}</p>

        {/* Chart area */}
        <div ref={containerRef} style={{ position: "relative", minHeight: 400 }}>
          {viewMode === "chart" && (
            <>
              <div style={{ position: "absolute", left: 16, top: 10, zIndex: 10, background: "rgba(255,255,255,0.97)", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", width: 260, backdropFilter: "blur(4px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{current.title}</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{current.metrics.val}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                  <span>📈 Last Year Growth</span>
                  <span style={{ fontWeight: 600, color: "#22c55e" }}>{current.metrics.lastYr}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                  <span>📈 Last 3 Years Avg</span>
                  <span style={{ fontWeight: 600, color: "#22c55e" }}>{current.metrics.last3Y}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                  <span>⭐ Next 3 Years Avg</span>
                  <span style={{ fontWeight: 600, color: "#22c55e" }}>{current.metrics.next3Y}</span>
                </div>
                <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 8, paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>⚠️ Trend</span>
                  <span style={{ fontWeight: 600, color: "#22c55e" }}>{current.metrics.trend}</span>
                </div>
              </div>
              <svg ref={chartRef} style={{ width: "100%", height: "auto", minHeight: 400 }} />
            </>
          )}
          {viewMode === "table" && <DataTable data={filteredData} />}
          {viewMode === "grid" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
              {Object.entries(datasets).map(([key, ds]) => (
                <div key={key} onClick={() => navigate(key as DatasetKey)}
                  style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 16, cursor: "pointer", transition: "box-shadow 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <MiniChart data={ds.data} title={ds.title} color={customColor} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dark separation line */}
        <div style={{ marginTop: 40, marginBottom: 40, borderTop: "1px solid #e2e8f0" }} />

        {/* Settings panel */}
        {showSettings && (
          <div ref={settingsRef} style={{ position: "absolute", top: 100, right: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "8px 10px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", zIndex: 30, width: showColorPickerMode ? 240 : 200, transition: "width 0.2s ease" }}>
            {!showColorPickerMode ? (
              <>
                <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>Settings</h3>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, fontSize: 11 }}>
                    <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} /> Show Labels
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, fontSize: 11 }}>
                    <input type="checkbox" checked={showPercentChanges} onChange={e => setShowPercentChanges(e.target.checked)} /> Show % Changes
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, fontSize: 11 }}>
                    <input type="checkbox" checked={showTooltip} onChange={e => setShowTooltip(e.target.checked)} /> Show Tooltip
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                    <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> Grid
                  </label>
                </div>
                <button onClick={() => setShowColorPickerMode(true)} style={{ width: "100%", padding: "4px 8px", background: "transparent", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 20, fontWeight: 500, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Color</span>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: customColor, border: "1px solid #cbd5e1" }} />
                </button>
              </>
            ) : (
              <div style={{ width: "100%" }}>
                <HexColorPicker color={customColor} onChange={handleColorChange} style={{ width: "100%", height: 80, marginBottom: 6 }} />
                <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 3, background: customColor, border: "1px solid #cbd5e1" }} />
                  <div style={{ flex: 1.2, border: "1px solid #e2e8f0", borderRadius: 3, padding: "1px 3px", background: "#fafafa" }}>
                    <input type="text" value={customColor} onChange={e => /^#[0-9A-F]{6}$/i.test(e.target.value) && handleColorChange(e.target.value)} style={{ border: "none", outline: "none", width: "100%", fontFamily: "monospace", fontSize: 8, textTransform: "uppercase", background: "transparent", textAlign: "center" }} />
                  </div>
                  <div style={{ flex: 0.8, border: "1px solid #e2e8f0", borderRadius: 3, padding: "1px 2px", background: "#fafafa", textAlign: "center" }}>
                    <div style={{ fontSize: 7, color: "#64748b" }}>R</div>
                    <div style={{ fontSize: 8, fontWeight: 500 }}>{rgb.r}</div>
                  </div>
                  <div style={{ flex: 0.8, border: "1px solid #e2e8f0", borderRadius: 3, padding: "1px 2px", background: "#fafafa", textAlign: "center" }}>
                    <div style={{ fontSize: 7, color: "#64748b" }}>G</div>
                    <div style={{ fontSize: 8, fontWeight: 500 }}>{rgb.g}</div>
                  </div>
                  <div style={{ flex: 0.8, border: "1px solid #e2e8f0", borderRadius: 3, padding: "1px 2px", background: "#fafafa", textAlign: "center" }}>
                    <div style={{ fontSize: 7, color: "#64748b" }}>B</div>
                    <div style={{ fontSize: 8, fontWeight: 500 }}>{rgb.b}</div>
                  </div>
                </div>
                <div style={{ textAlign: "center", fontSize: 7, color: "#64748b", marginBottom: 6 }}>RGBA</div>
                <div>
                  <div style={{ fontSize: 8, marginBottom: 3, color: "#64748b" }}>More colors</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {["#FF0000", "#FFA500", "#FFFF00", "#008000", "#0000FF", "#4B0082"].map(c => (
                      <button key={c} onClick={() => handleColorChange(c)} style={{ width: 18, height: 18, borderRadius: 2, border: "1px solid #e2e8f0", background: c, cursor: "pointer" }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tooltip */}
        <div ref={tooltipRef} style={{ position: "fixed", background: "#fff", padding: "6px 10px", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", pointerEvents: "none", opacity: 0, border: "1px solid #e2e8f0", zIndex: 100, fontSize: 11 }} />

        {/* Footer navigation */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 24, flexWrap: "wrap" }}>
          <div onClick={() => prevTab && navigate(prevTab)} style={{ width: 280, padding: 16, border: "1px solid #e2e8f0", borderRadius: 12, cursor: prevTab ? "pointer" : "default", opacity: prevTab ? 1 : 0.4, background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, color: "#94a3b8" }}>←</span>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>BACK</div>
                <div style={{ fontWeight: 600, fontSize: 16, color: "#0f172a" }}>{prevTab ? datasets[prevTab].title : "—"}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                  {prevTab === "revenue" ? "Is the business growing fast?" : prevTab === "ebitda" ? "Operational profitability metric" : ""}
                </div>
              </div>
            </div>
          </div>
          <div onClick={() => nextTab && navigate(nextTab)} style={{ width: 280, padding: 16, background: nextTab ? customColor : "#e2e8f0", borderRadius: 12, cursor: nextTab ? "pointer" : "default", opacity: nextTab ? 1 : 0.5, color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>NEXT</div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{nextTab ? datasets[nextTab].title : "—"}</div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                  {nextTab === "earnings" ? "What is the real profit?" : nextTab === "ebitda" ? "Operational profitability" : ""}
                </div>
              </div>
              <span style={{ fontSize: 18 }}>→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}