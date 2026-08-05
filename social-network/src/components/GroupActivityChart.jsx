"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";
import { STATS_URL } from "@/lib/Api";

const WIDTH = 520;
const HEIGHT = 220;
const MARGIN = { top: 12, right: 12, bottom: 30, left: 34 };

const GroupActivityChart = ({ name, weeks = 12, refreshKey }) => {
  const svgRef = useRef(null);
  const [buckets, setBuckets] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!name) return;
    axios
      .post(STATS_URL, { command: "groupActivity", data: { name, weeks } })
      .then((res) => {
        setBuckets(res.data.weeks || []);
        setTotal(res.data.total || 0);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Could not load activity"),
      );
  }, [name, weeks, refreshKey]);

  useEffect(() => {
    if (!buckets.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);

    const x = d3
      .scaleBand()
      .domain(buckets.map((one) => one.weekStart))
      .range([MARGIN.left, WIDTH - MARGIN.right])
      .padding(0.25);

    const peak = d3.max(buckets, (one) => one.count) || 1;
    const y = d3
      .scaleLinear()
      .domain([0, peak])
      .nice()
      .range([HEIGHT - MARGIN.bottom, MARGIN.top]);

    svg
      .append("g")
      .attr("transform", `translate(0,${HEIGHT - MARGIN.bottom})`)
      .attr("font-size", 9)
      .call(
        d3
          .axisBottom(x)
          .tickFormat((one) =>
            d3.utcFormat("%d/%m")(new Date(one + "T00:00:00Z")),
          ),
      )
      .call((g) => g.selectAll("line").attr("stroke", "#e5e7eb"))
      .call((g) => g.select(".domain").attr("stroke", "#e5e7eb"));

    svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},0)`)
      .attr("font-size", 9)
      .call(
        d3
          .axisLeft(y)
          .ticks(Math.min(4, peak))
          .tickFormat(d3.format("d"))
          .tickSizeOuter(0),
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", WIDTH - MARGIN.left - MARGIN.right)
          .attr("stroke", "#f3f4f6"),
      );

    svg
      .append("g")
      .selectAll("rect")
      .data(buckets)
      .join("rect")
      .attr("x", (one) => x(one.weekStart))
      .attr("y", (one) => y(one.count))
      .attr("width", x.bandwidth())
      .attr("height", (one) => y(0) - y(one.count))
      .attr("rx", 2)
      .attr("fill", "#ea580c")
      .append("title")
      .text((one) => `${one.count} posts in week of ${one.weekStart}`);
  }, [buckets]);

  return (
    <div className="space-y-1 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Posts per week</h2>
        <p className="text-xs text-gray-500">
          {total} in the last {weeks} weeks
        </p>
      </div>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <svg ref={svgRef} className="w-full" />
      )}
    </div>
  );
};

export default GroupActivityChart;
