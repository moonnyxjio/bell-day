// src/pages/Result.js
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Result() {
  const nav = useNavigate();
  const { state } = useLocation();
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  const [openId, setOpenId] = useState(null);

  const all = useMemo(
    () => JSON.parse(localStorage.getItem("records") || "[]"),
    []
  );

  const rows = useMemo(() => {
    if (!state?.name || !state?.date || !state?.day) return all.slice(-10);
    return all.filter(
      (r) => r.name === state.name && r.date === state.date && r.day === state.day
    );
  }, [all, state]);

  const total = rows.reduce((a, r) => a + (r.totalChunks || 0), 0);
  const wrong = rows.reduce((a, r) => a + (r.wrongIdxs?.length || 0), 0);
  const right = total - wrong;
  const pct = total ? Math.round((right / total) * 100) : 0;

  const displayRows = showWrongOnly
    ? rows.filter((r) => (r.wrongIdxs?.length || 0) > 0)
    : rows;

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">결과</h1>
        <p className="subtitle">
          {state?.name} | {state?.date} | {state?.day?.toUpperCase()}
        </p>

        <div><strong>점수:</strong> {right}/{total} ({pct}%)</div>

        <div className="nav">
          <button className="btn" onClick={() => setShowWrongOnly(v => !v)}>
            {showWrongOnly ? "전체 보기" : "오답만 보기"}
          </button>
          <button className="btn primary" onClick={() => nav("/")}>처음으로</button>
        </div>

        <table className="list" style={{ marginTop: 12 }}>
          <tbody>
            {displayRows.map((r, i) => {
              const wrong = new Set(r.wrongIdxs || []);
              return (
                <React.Fragment key={r.ts}>
                  <tr onClick={() => setOpenId(openId === r.ts ? null : r.ts)}>
                    <td style={{ textAlign: "left", cursor: "pointer" }}>
                      {i + 1}. {r.koChunks.join(" / ")}
                    </td>
                    <td>{r.totalChunks - wrong.size}/{r.totalChunks}</td>
                  </tr>

                  {openId === r.ts && (
                    <tr>
                      <td colSpan={2}>
                        <div style={{ marginBottom: 6 }}>정답 문장:</div>
                        {r.enChunks.map((w, idx) => (
                          <span
                            key={idx}
                            style={{
                              marginRight: 6,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: wrong.has(idx) ? "#ffe8e8" : "#eef8ff",
                              color: wrong.has(idx) ? "#c40000" : "#003a70",
                            }}
                          >
                            {w}
                          </span>
                        ))}

                        <div style={{ marginTop: 10 }}>학생 답안:</div>
                        <div style={{ padding: "6px", border: "1px solid #ddd" }}>
                          {r.user}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
