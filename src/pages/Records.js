// src/pages/Records.js
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function Records() {
  const nav = useNavigate();

  // 로컬스토리지에 저장된 기록 가져오기
  const all = useMemo(
    () => JSON.parse(localStorage.getItem("records") || "[]"),
    []
  );

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

  // 최신순 정렬
  const list = [...all].sort((a, b) => b.ts - a.ts);

  return (
    <div className="container">
      <div className="card" style={{ width: "100%", maxWidth: 960 }}>
        <h1 className="title">기록</h1>
        <p className="subtitle" style={{ marginTop: 8 }}>
          총 {list.length}개 기록
        </p>

        <div className="nav" style={{ marginTop: 8 }}>
          <button className="btn" onClick={() => nav("/")}>처음으로</button>
        </div>

        {/* 기록 리스트 */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {list.map((r, i) => {
            const wrong = new Set(r.wrongIdxs || []);
            return (
              <div
                key={r.ts + "_" + i}
                style={{
                  border: "1px solid #2e2e2e",
                  borderRadius: 12,
                  padding: 16,
                  background: "var(--card,#111)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>
                    {r.name || "학생"} · {r.date} · {String(r.day).toUpperCase()}
                  </div>
                  <div>
                    {r.score}/{r.totalChunks}{" "}
                    <span style={{ color: wrong.size ? "#ff6b6b" : "#22c55e", fontWeight: 700 }}>
                      {wrong.size ? "오답" : "정답"}
                    </span>
                  </div>
                </div>

                {/* 문제 한국어 */}
                <div style={{ fontSize: 14, marginBottom: 6, opacity: 0.85 }}>
                  {r.koChunks?.join(" / ")}
                </div>

                {/* 정답 문장 */}
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>정답 문장:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(r.enChunks || []).map((w, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 8,
                          border: "1px solid",
                          borderColor: wrong.has(idx) ? "var(--bad,#ff6b6b)" : "var(--ok,#22c55e)",
                        }}
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 학생 답안 */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>학생 답안:</div>
                  <div
                    style={{
                      border: "1px solid #333",
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      background: "rgba(255,255,255,0.02)",
                      wordBreak: "break-word",
                    }}
                  >
                    {r.user || "(입력/인식 없음)"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
