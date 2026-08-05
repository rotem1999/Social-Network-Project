"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";
import { STATS_URL } from "@/lib/Api";

const CELL = 12;
const GAP = 3;
const TOP = 18;
const LEFT = 26;
const EMPTY = "#ebedf0";
const RAMP = ["#fed7aa", "#fdba74", "#fb923c", "#ea580c"];

const ContributionGraph = ({ username, weeks = 53, refreshKey }) => {
  const svgRef = useRef(null);
  const [days, setDays] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .post(STATS_URL, {
        command: "contributions",
        data: { username, weeks },
      })
      .then((res) => {
        setDays(res.data.days || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => setError("Could not load contributions"));
  }, [username, weeks, refreshKey]);

  useEffect(() => {
    if (!days.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const columns = Math.ceil(days.length / 7);
    const width = LEFT + columns * (CELL + GAP);
    const height = TOP + 7 * (CELL + GAP);
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const max = d3.max(days, (one) => one.count) || 1;
    const color = d3.scaleQuantize().domain([1, max]).range(RAMP);

    svg
      .append("g")
      .selectAll("rect")
      .data(days)
      .join("rect")
      .attr("x", (one, index) => LEFT + Math.floor(index / 7) * (CELL + GAP))
      .attr("y", (one, index) => TOP + (index % 7) * (CELL + GAP))
      .attr("width", CELL)
      .attr("height", CELL)
      .attr("rx", 2)
      .attr("fill", (one) => (one.count === 0 ? EMPTY : color(one.count)))
      .append("title")
      .text((one) => `${one.count} contributions on ${one.date}`);

    svg
      .append("g")
      .attr("font-size", 9)
      .attr("fill", "#9ca3af")
      .selectAll("text")
      .data([
        ["Mon", 1],
        ["Wed", 3],
        ["Fri", 5],
      ])
      .join("text")
      .attr("x", 0)
      .attr("y", (one) => TOP + one[1] * (CELL + GAP) + CELL - 2)
      .text((one) => one[0]);

    const months = [];
    days.forEach((one, index) => {
      if (index % 7 !== 0) return;
      const month = new Date(one.date + "T00:00:00Z").getUTCMonth();
      if (!months.length || months[months.length - 1].month !== month) {
        months.push({ month, column: Math.floor(index / 7), date: one.date });
      }
    });

    svg
      .append("g")
      .attr("font-size", 9)
      .attr("fill", "#9ca3af")
      .selectAll("text")
      .data(months)
      .join("text")
      .attr("x", (one) => LEFT + one.column * (CELL + GAP))
      .attr("y", TOP - 6)
      .text((one) => d3.utcFormat("%b")(new Date(one.date + "T00:00:00Z")));
  }, [days]);

  return (
    <div className="space-y-1 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Contributions</h2>
        <p className="text-xs text-gray-500">{total} in the last year</p>
      </div>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <svg ref={svgRef} className="w-full min-w-[620px]" />
        </div>
      )}
      <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400">
        Less
        {[EMPTY, ...RAMP].map((shade) => (
          <span
            key={shade}
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: shade }}
          />
        ))}
        More
      </div>
    </div>
  );
};

export default ContributionGraph;
