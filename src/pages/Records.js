// src/pages/Records.js
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

export default function Records() {
  const nav = useNavigate();

  const all = useMemo(
    () => JSON.parse(localStorage.getItem("records") || "[]"),
    []
  );
  const list = useMemo(() => [...all].sort((a, b) => b.ts - a.ts), [all]);

  const names = useMemo(() => {
    const s = new Set(list.map((r) => (r.name || "").trim()).filter(Boolean));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "ko"));
  }, [list]);

  const days = useMemo(() => {
    const s = new Set(list.map((r) => String(r.day || "").toLowerCase()).filter(Boolean));
    return Array.from(s).sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, "") || "0", 10);
      const nb = parseInt(b.replace(/\D/g, "") || "0", 10);
      return na - nb;
    });
  }, [list]);

  const [openFilter, setOpenFilter] = useState(true);
  const [selNames, setSelNames] = useState(new Set());
  const [selDays, setSelDays] = useState(new Set());

  const toggleInSet = (set, value) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const filtered = useMemo(() => {
    return list.filter((r) => {
      const nm = (r.name || "").trim();
      const dy = String(r.day || "").toLowerCase();
      const okName = selNames.size === 0 || selNames.has(nm);
      const okDay = selDays.size === 0 || selDays.has(dy);
      return okName && okDay;
    });
  }, [list, selNames, selDays]);

  const statsByStudent = useMemo(() => {
    const map = {};
    list.forEach((r) => {
      const nm = (r.name || "학생").trim();
      if (!map[nm]) map[nm] = { correct: 0, total: 0 };
      map[nm].correct += r.score ?? 0;
      map[nm].total += r.totalChunks ?? 0;
    });
    return map;
  }, [list]);

  const statsByDay = useMemo(() => {
    const map = {};
    list.forEach((r) => {
      const dy = String(r.day || "").toUpperCase();
      if (!map[dy]) map[dy] = { correct: 0, total: 0 };
      map[dy].correct += r.score ?? 0;
      map[dy].total += r.totalChunks ?? 0;
    });
    return map;
  }, [list]);

  const COLORS = ["#22c55e", "#ff6b6b", "#3b82f6", "#f59e0b"];

  const studentData = Object.entries(statsByStudent).map(([name, s]) => ({
    name,
    percent: s.total ? Math.round((s.correct / s.total) * 100) : 0,
  }));

  const dayData = Object.entries(statsByDay).map(([day, s]) => ({
    name: day,
    percent: s.total ? Math.round((s.correct / s.total) * 100) : 0,
  }));

  if (!all.length) {
    return (
      <div className="container">
        <div className="card">
          <h1 className="title">기록</h1>
          <p className="subtitle">저장된 기록이 없어요.</p>
          <div className="nav">
            <button className="btn" onClick={() => nav("/")}>처음으로</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ width: "100%", maxWidth: 1000 }}>
        <h1 className="title">기록</h1>

        {/* 📊 학생별 성취도 그래프 */}
        <h3 style={{ marginTop: 20 }}>학생별 성취도 (%)</h3>
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={studentData}>
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="percent" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 📊 Day별 성취도 그래프 */}
        <h3 style={{ marginTop: 20 }}>Day별 성취도 (%)</h3>
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={dayData}
                dataKey="percent"
                nameKey="name"
                outerRadius={120}
                label
              >
                {dayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 🔘 필터 & 기록 리스트 (이전 버전과 동일) */}
        <div className="nav" style={{ marginTop: 20, gap: 8 }}>
          <button className="btn" onClick={() => nav("/")}>처음으로</button>
          <button className="btn" onClick={() => setOpenFilter((v) => !v)}>
            {openFilter ? "필터 접기" : "필터 펼치기"}
          </button>
          <button
            className="btn danger"
            onClick={() => {
              setSelNames(new Set());
              setSelDays(new Set());
            }}
          >
            필터 초기화
          </button>
        </div>

        {openFilter && (
          <div style={{ marginTop: 16 }}>
            <h3>필터</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {names.map((nm) => (
                <button
                  key={nm}
                  className="btn"
                  onClick={() => setSelNames((s) => toggleInSet(s, nm))}
                  style={{
                    borderColor: selNames.has(nm) ? "#22c55e" : undefined,
                    color: selNames.has(nm) ? "#22c55e" : undefined,
                  }}
                >
                  {nm}
                </button>
              ))}
              {days.map((dy) => (
                <button
                  key={dy}
                  className="btn"
                  onClick={() => setSelDays((s) => toggleInSet(s, dy))}
                  style={{
                    borderColor: selDays.has(dy) ? "#22c55e" : undefined,
                    color: selDays.has(dy) ? "#22c55e" : undefined,
                  }}
                >
                  {dy.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 기록 리스트 */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((r, i) => (
            <div
              key={r.ts + "_" + i}
              style={{
                border: "1px solid #2e2e2e",
                borderRadius: 12,
                padding: 16,
                background: "var(--card,#111)",
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {r.name} · {r.date} · {String(r.day).toUpperCase()}
              </div>
              <div style={{ marginTop: 6, fontSize: 14 }}>
                정답률: {r.score}/{r.totalChunks}
              </div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>
                문제: {r.koChunks?.join(" / ")}
              </div>
              <div style={{ marginTop: 6 }}>
                정답: {r.enChunks?.join(" ")}
              </div>
              <div style={{ marginTop: 6 }}>
                답안: {r.user}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
