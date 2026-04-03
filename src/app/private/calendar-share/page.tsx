"use client";

import { useState, useEffect, useCallback } from "react";

interface Outing {
  departure: string;
  return: string;
  destinations: string[];
}

interface DayData {
  date: string;
  outings: Outing[];
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

export default function CalendarSharePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const fetchData = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?year=${y}&month=${m}`);
      const json = await res.json();
      setDays(json.days || []);
    } catch {
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(year, month);
  }, [year, month, fetchData]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const dayMap = new Map(days.map(d => [d.date, d]));
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ fontFamily: "'Albert Sans', -apple-system, sans-serif", width: "100%", minHeight: "100vh", padding: "20px 16px 40px", boxSizing: "border-box" }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%); }
          to   { transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
        .cal-cell-outing:hover {
          background: #e6e9ff !important;
        }
        /* PC: centered modal */
        @media (min-width: 640px) {
          .modal-sheet {
            bottom: auto !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            border-radius: 20px !important;
            max-height: 80vh !important;
            animation: fadeIn 0.2s ease !important;
          }
        }
        /* Mobile: bottom sheet */
        @media (max-width: 639px) {
          .modal-sheet {
            animation: slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1) !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Card */}
        <div style={{ background: "#ffffff", borderRadius: 24, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", padding: "20px 16px 24px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <button onClick={prevMonth} style={circleBtn}>‹</button>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.3px", margin: 0 }}>
              {year}年{month}月
            </h2>
            <button onClick={nextMonth} style={circleBtn}>›</button>
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {/* Weekday headers */}
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                color: i === 0 ? "#e54040" : i === 6 ? "#2b6fd4" : "#888899",
              }}>
                {d}
              </div>
            ))}

            {/* Day cells */}
            {loading
              ? Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} style={{
                    height: 72,
                    borderRadius: 10,
                    background: "linear-gradient(90deg, #ececee 25%, #f4f4f6 50%, #ececee 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.4s infinite",
                    border: "1px solid transparent",
                  }} />
                ))
              : cells.map((day, i) => {
                  if (!day) return (
                    <div key={i} style={{ height: 72, border: "1px solid transparent", borderRadius: 10 }} />
                  );

                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const data = dayMap.get(dateStr);
                  const hasOuting = data && data.outings.length > 0;
                  const isToday = dateStr === todayStr;
                  const dow = (firstDow + day - 1) % 7;
                  const isSun = dow === 0;
                  const isSat = dow === 6;

                  const borderColor = isToday ? "#4f6ef7" : hasOuting ? "#c8cef7" : "#e8e8ec";
                  const bgColor = hasOuting ? "#f0f2ff" : "#ffffff";

                  return (
                    <div
                      key={i}
                      className={hasOuting ? "cal-cell-outing" : ""}
                      onClick={() => hasOuting && data && setSelectedDay(data)}
                      style={{
                        minHeight: 72,
                        borderRadius: 10,
                        padding: "6px 5px 5px",
                        background: bgColor,
                        border: `${isToday ? "1.5" : "1"}px solid ${borderColor}`,
                        cursor: hasOuting ? "pointer" : "default",
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Day number */}
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                        {isToday ? (
                          <span style={{
                            width: 24, height: 24,
                            borderRadius: "50%",
                            background: "#4f6ef7",
                            color: "#fff",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 700,
                            lineHeight: 1,
                          }}>{day}</span>
                        ) : (
                          <span style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: isSun ? "#e54040" : isSat ? "#2b6fd4" : "#1a1a1a",
                            lineHeight: "24px",
                          }}>{day}</span>
                        )}
                      </div>

                      {/* Outing pills */}
                      {hasOuting && data && data.outings.slice(0, 2).map((o, oi) => (
                        <div key={oi} style={{
                          background: "#eef0ff",
                          borderRadius: 5,
                          padding: "3px 5px",
                          marginBottom: 2,
                        }}>
                          <div style={{ fontSize: 9, fontWeight: 600, color: "#4f6ef7", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {o.departure}〜{o.return}
                          </div>
                          {o.destinations.length > 0 && (
                            <div style={{ fontSize: 9, fontWeight: 500, color: "#555566", lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {o.destinations.join("・")}
                            </div>
                          )}
                        </div>
                      ))}
                      {hasOuting && data && data.outings.length > 2 && (
                        <div style={{ fontSize: 9, color: "#888899", textAlign: "center" }}>+{data.outings.length - 2}</div>
                      )}
                    </div>
                  );
                })
            }
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedDay && (
        <div
          onClick={() => setSelectedDay(null)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 200,
          }}
        >
          <div
            className="modal-sheet"
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "calc(100% - 32px)",
              maxWidth: 430,
              background: "#ffffff",
              borderRadius: "24px 24px 0 0",
              boxShadow: "0 -4px 32px rgba(0,0,0,0.16)",
              maxHeight: "75vh",
              overflowY: "auto",
              paddingBottom: 16,
            }}
          >
            {/* Drag handle */}
            <div style={{ width: 36, height: 4, background: "#e0e0e6", borderRadius: 2, margin: "12px auto 0" }} />

            {/* Date heading */}
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", margin: "16px 20px 16px", paddingBottom: 12, borderBottom: "1px solid #f0f0f4" }}>
              {selectedDay.date.replace(/-/g, "/")}の外出
            </h3>

            {/* Outing cards */}
            {selectedDay.outings.map((o, i) => (
              <div key={i} style={{ margin: "0 16px 12px", background: "#f7f8ff", borderRadius: 16, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#888899" }}>出発</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>{o.departure}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#888899" }}>帰宅</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>{o.return}</span>
                </div>
                {o.destinations.length > 0 && (
                  <div style={{ borderTop: "1px solid #e8e8ec", paddingTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#888899", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>行き先</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#4f6ef7" }}>
                      {o.destinations.join(" → ")}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Close button */}
            <button
              onClick={() => setSelectedDay(null)}
              style={{
                display: "block",
                width: "calc(100% - 32px)",
                margin: "4px 16px 0",
                padding: 14,
                background: "#f0f0f4",
                border: "none",
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 600,
                color: "#555566",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const circleBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "#ffffff",
  border: "1px solid #e8e8ec",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
  color: "#888899",
  cursor: "pointer",
  padding: 0,
  lineHeight: 1,
};
