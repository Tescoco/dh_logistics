"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }>;
}

interface DeliveryChartProps {
  period: string;
  className?: string;
}

export default function DeliveryChart({
  period,
  className = "",
}: DeliveryChartProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChartData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/deliveries/chart-data?period=${period}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch chart data");
        }

        const data = await response.json();
        setChartData(data);
      } catch (err) {
        console.error("Chart data fetch error:", err);
        setError("Failed to load chart data");
      } finally {
        setLoading(false);
      }
    }

    fetchChartData();
  }, [period]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
                      font: {
              size: 12,
              weight: 500,
            },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(148, 163, 184, 0.2)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function (context: unknown) {
            const ctx = context as { label: string }[];
            return `${ctx[0]?.label || ''}`;
          },
          label: function (context: unknown) {
            const ctx = context as { dataset: { label: string }; parsed: { y: number } };
            return `${ctx.dataset.label}: ${ctx.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: "#64748b",
          font: {
            size: 11,
          },
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
          borderDash: [5, 5],
        },
        ticks: {
          color: "#64748b",
          font: {
            size: 11,
          },
          callback: function (value: unknown) {
            return Number.isInteger(value as number) ? (value as number) : "";
          },
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
      line: {
        borderWidth: 2.5,
        fill: true,
      },
    },
  };

  if (loading) {
    return (
      <div
        className={`h-64 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl ${className}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-slate-600 font-medium">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`h-64 flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 rounded-xl ${className}`}
      >
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-red-200 flex items-center justify-center mx-auto mb-3">
            <span className="text-red-600 text-xl">⚠</span>
          </div>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div
        className={`h-64 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl ${className}`}
      >
        <div className="text-center">
          <p className="text-slate-600 font-medium">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-64 ${className}`}>
      <Line data={chartData} options={options} />
    </div>
  );
}
