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
  return new Date(year, month - 1, 1).getDay(); // 0=Sun
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
    <div style={{ fontFamily: "-apple-system, sans-serif", maxWidth: 480, margin: "0 auto", padding: "16px 8px", background: "#fff", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={prevMonth} style={navBtn}>‹</button>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>
          {year}年{month}月
        </h2>
        <button onClick={nextMonth} style={navBtn}>›</button>
      </div>

      {/* Calendar grid (headers + cells in one grid) */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#888", fontSize: 14 }}>読み込み中...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {WEEKDAYS.map((d, i) => (
            <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: i === 0 ? "#e53935" : i === 6 ? "#1565c0" : "#888", padding: "4px 0" }}>
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const data = dayMap.get(dateStr);
            const hasOuting = data && data.outings.length > 0;
            const isToday = dateStr === todayStr;
            const dow = (firstDow + day - 1) % 7;
            const isSun = dow === 0;
            const isSat = dow === 6;

            return (
              <div
                key={i}
                onClick={() => data && hasOuting && setSelectedDay(data)}
                style={{
                  minHeight: 72,
                  borderRadius: 8,
                  padding: "6px 4px",
                  background: isToday ? "#e8f0fe" : hasOuting ? "#f8f9ff" : "#fafafa",
                  border: isToday ? "1.5px solid #4285f4" : "1px solid #eee",
                  cursor: hasOuting ? "pointer" : "default",
                  position: "relative",
                }}
              >
                <div style={{
                  fontSize: 13,
                  fontWeight: isToday ? 700 : 500,
                  color: isSun ? "#e53935" : isSat ? "#1565c0" : "#1a1a1a",
                  marginBottom: 4,
                  textAlign: "center",
                }}>
                  {isToday ? (
                    <span style={{ background: "#4285f4", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{day}</span>
                  ) : day}
                </div>
                {hasOuting && data && data.outings.map((o, oi) => (
                  <div key={oi} style={{ fontSize: 10, color: "#3a3a8c", background: "#e8eaf6", borderRadius: 4, padding: "2px 4px", marginBottom: 2, lineHeight: 1.4 }}>
                    <div style={{ fontWeight: 600 }}>{o.departure}〜{o.return}</div>
                    <div style={{ color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {o.destinations.join("・")}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedDay && (
        <div
          onClick={() => setSelectedDay(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 480, maxHeight: "70vh", overflowY: "auto" }}
          >
            <div style={{ width: 36, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#1a1a1a" }}>
              {selectedDay.date.replace(/-/g, "/")}の外出
            </h3>
            {selectedDay.outings.map((o, i) => (
              <div key={i} style={{ background: "#f5f7ff", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#555" }}>出発</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>{o.departure}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#555" }}>帰宅</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>{o.return}</span>
                </div>
                <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 13, color: "#555" }}>行き先</span>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#3a3a8c", marginTop: 4 }}>
                    {o.destinations.join(" → ")}
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setSelectedDay(null)}
              style={{ width: "100%", padding: "12px", background: "#f0f0f0", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, color: "#333", cursor: "pointer", marginTop: 4 }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: 24,
  color: "#555",
  cursor: "pointer",
  padding: "4px 12px",
  borderRadius: 8,
};
