// src/pages/Badges.js
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { QUESTIONS } from "../data";

// mastery_v1 불러오기
const MASTER_KEY = "mastery_v1";
const loadMastery = () => {
  try {
    return JSON.parse(localStorage.getItem(MASTER_KEY) || "{}");
  } catch {
    return {};
  }
};

export default function Badges() {
  const nav = useNavigate();
  const mastery = useMemo(() => loadMastery(), []);
  const students = Object.keys(mastery);

  // Day 리스트 (data.js 기반)
  const days = Object.keys(QUESTIONS || {}).sort(
    (a, b) =>
      parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, ""))
  );

  const badgeStyle = (done) => ({
    padding: "6px 12px",
    borderRadius: 999,
    border: `1px solid ${done ? "#22c55e" : "#666"}`,
    background: done ? "#22c55e22" : "transparent",
    color: done ? "#22c55e" : "#bbb",
    fontWeight: 700,
    minWidth: 90,
    textAlign: "center",
  });

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 1000 }}>
        <h1 className="title">학생 누적 뱃지 보관함</h1>
        {!students.length ? (
          <div className="muted">아직 기록이 없어요.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {students.map((name) => (
              <div
                key={name}
                style={{
                  border: "1px solid #2e2e2e",
                  borderRadius: 12,
                  padding: 12,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 10 }}>{name}</div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  {days.map((day) => {
                    const total = (QUESTIONS[day] || []).length;
                    const mastered = mastery[name]?.[day]?.length || 0;
                    const done = total > 0 && mastered === total;
                    return (
                      <div key={day} style={badgeStyle(done)}>
                        {String(day).toUpperCase()}
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          {done ? "✅ 완료" : `${mastered}/${total}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="nav" style={{ marginTop: 16 }}>
          <button className="btn" onClick={() => nav("/")}>
            처음으로
          </button>
        </div>
      </div>
    </div>
  );
}
