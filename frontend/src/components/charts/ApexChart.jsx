import { useEffect, useRef } from "react";
import ApexCharts from "apexcharts";

// Lightweight React wrapper around ApexCharts without react-apexcharts dependency.
export default function ApexChart({
  type = "radialBar",
  options = {},
  series = [],
  height = 280,
  width = "100%",
}) {
  const ref = useRef(null);

  useEffect(() => {
    const chart = new ApexCharts(ref.current, {
      ...options,
      chart: {
        type,
        height,
        toolbar: { show: false },
        animations: { enabled: true },
        ...options.chart,
      },
      stroke: { lineCap: "round" },
      grid: { borderColor: "#e2e8f0" },
      theme: { mode: "light" },
      series,
    });

    chart.render();
    return () => {
      chart.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, height, JSON.stringify(options), JSON.stringify(series)]);

  return <div ref={ref} style={{ width, height }} />;
}
