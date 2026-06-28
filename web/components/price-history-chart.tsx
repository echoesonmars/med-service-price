"use client";

import { useEffect, useState } from "react";
import { FaChartLine, FaTimes } from "react-icons/fa";

interface PriceHistoryPoint {
  recorded_at: string;
  price: number;
}

interface PriceHistoryChartProps {
  serviceId: string;
  serviceName: string;
  onClose?: () => void;
}

export function PriceHistoryChart({
  serviceId,
  serviceName,
  onClose,
}: PriceHistoryChartProps) {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, days]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/services/${serviceId}/price-history?days=${days}`
      );
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Error fetching price history:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (history.length === 0) return null;

    const prices = history.map((h) => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const current = prices[prices.length - 1];
    const first = prices[0];
    const change = current - first;
    const changePercent = ((change / first) * 100).toFixed(1);

    return { min, max, avg, current, change, changePercent };
  };

  const stats = calculateStats();

  // Calculate SVG path for line chart
  const generateChartPath = () => {
    if (history.length === 0) return "";

    const width = 600;
    const height = 200;
    const padding = 20;

    const prices = history.map((h) => h.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const points = history.map((point, index) => {
      const x = padding + (index / (history.length - 1 || 1)) * (width - 2 * padding);
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding);
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
              <FaChartLine className="text-accent text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-foreground">
                История изменения цены
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {serviceName}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-muted-foreground transition-colors"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Time Period Selector */}
        <div className="px-6 pt-6">
          <div className="flex gap-2">
            {[7, 30, 90, 180].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-lg text-sm font-heading font-semibold transition-colors ${
                  days === d
                    ? "bg-accent text-white"
                    : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                }`}
              >
                {d} дней
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-accent/20" />
              <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
            </div>
            <p className="mt-4 text-sm font-heading font-semibold text-muted-foreground">
              Загрузка истории...
            </p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground font-heading">
              История цен недоступна за выбранный период
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="px-6 pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-heading font-semibold mb-1">
                    Текущая
                  </p>
                  <p className="text-xl font-heading font-bold text-foreground">
                    {stats.current.toLocaleString()} ₸
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-heading font-semibold mb-1">
                    Изменение
                  </p>
                  <p
                    className={`text-xl font-heading font-bold ${
                      stats.change > 0
                        ? "text-red-500"
                        : stats.change < 0
                        ? "text-green-500"
                        : "text-gray-500"
                    }`}
                  >
                    {stats.change > 0 ? "+" : ""}
                    {stats.changePercent}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-heading font-semibold mb-1">
                    Минимум
                  </p>
                  <p className="text-xl font-heading font-bold text-foreground">
                    {stats.min.toLocaleString()} ₸
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground font-heading font-semibold mb-1">
                    Максимум
                  </p>
                  <p className="text-xl font-heading font-bold text-foreground">
                    {stats.max.toLocaleString()} ₸
                  </p>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="px-6 py-6">
              <svg
                viewBox="0 0 600 200"
                className="w-full h-auto"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Grid lines */}
                <line
                  x1="20"
                  y1="20"
                  x2="20"
                  y2="180"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <line
                  x1="20"
                  y1="180"
                  x2="580"
                  y2="180"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />

                {/* Chart line */}
                <path
                  d={generateChartPath()}
                  fill="none"
                  stroke="rgb(56, 189, 248)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {history.map((point, index) => {
                  const width = 600;
                  const height = 200;
                  const padding = 20;
                  const prices = history.map((h) => h.price);
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  const priceRange = maxPrice - minPrice || 1;

                  const x =
                    padding +
                    (index / (history.length - 1 || 1)) * (width - 2 * padding);
                  const y =
                    height -
                    padding -
                    ((point.price - minPrice) / priceRange) *
                      (height - 2 * padding);

                  return (
                    <g key={index}>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="rgb(56, 189, 248)"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Date labels */}
              <div className="flex justify-between mt-2 text-xs text-muted-foreground font-heading">
                <span>{formatDate(history[0].recorded_at)}</span>
                {history.length > 2 && (
                  <span>
                    {formatDate(history[Math.floor(history.length / 2)].recorded_at)}
                  </span>
                )}
                <span>{formatDate(history[history.length - 1].recorded_at)}</span>
              </div>
            </div>

            {/* Data Table */}
            <div className="px-6 pb-6">
              <h3 className="text-sm font-heading font-bold text-foreground mb-3">
                Детальные данные
              </h3>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-heading font-semibold text-muted-foreground">
                        Дата
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-heading font-semibold text-muted-foreground">
                        Цена
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-heading font-semibold text-muted-foreground">
                        Изменение
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((point, index) => {
                      const prevPrice = index > 0 ? history[index - 1].price : point.price;
                      const change = point.price - prevPrice;
                      const changePercent = prevPrice
                        ? ((change / prevPrice) * 100).toFixed(1)
                        : "0.0";

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-foreground">
                            {new Date(point.recorded_at).toLocaleString("ru-RU", {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-2 text-sm text-right font-semibold text-foreground">
                            {point.price.toLocaleString()} ₸
                          </td>
                          <td
                            className={`px-4 py-2 text-sm text-right font-semibold ${
                              change > 0
                                ? "text-red-500"
                                : change < 0
                                ? "text-green-500"
                                : "text-gray-500"
                            }`}
                          >
                            {index === 0
                              ? "—"
                              : `${change > 0 ? "+" : ""}${changePercent}%`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
