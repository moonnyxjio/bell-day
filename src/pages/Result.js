// src/pages/Result.js
import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Result() {
  const nav = useNavigate();
  const { state } = useLocation(); // { name, date, day }
  const [showWrongOnly, setShowWrongOnly] = useState(true);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem("records") || "[]");
    if (state?.name || state?.date || state?.day) {
      const filtered = all.filter((r) => {
        const okName = state?.name ? r.name === state.name : true;
        const okDate = state?.date ? r.date === state.date : true;
        const okDay = state?.day ? r.day === state.day : true;
        return okName && okDate && okDay;
      });
      setRecords(filtered);
    } else {
      setRecords(all);
    }
  }, [state]);

  const summary = useMemo(() => {
    if (records.length === 0) return { total: 0, sum: 0, chunks: 0 };
    const totalQuestions = records.length;
    const sumScore = records.reduce((a, b) => a + (b.score || 0), 0);
    const sumChunks = records.reduce((a, b) => a + (b.totalChunks || 0), 0);
    return { total: totalQuestions, sum: sumScore, chunks: sumChunks };
  }, [records]);

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">결과</h1>
        {state?.name && (
          <div className="muted" style={{ marginBottom: 8 }}>
            {state.name} · {state.date} · {state.day?.toUpperCase?.?.() || state.day}
          </div>
        )}

        <div className="card" style={{ marginTop: 8 }}>
          <div>총 문항: {summary.total}</div>
          <div>
            총 점수: {summary.sum} / {summary.chunks} (
            {summary.chunks ? Math.round((summary.sum / summary.chunks) * 100) : 0}%)
          </div>
        </div>

        <div className="nav" style={{ marginTop: 12 }}>
          <button
            className="btn"
            onClick={() => setShowWrongOnly((v) => !v)}
          >
            {showWrongOnly ? "전체 보기" : "오답만 보기"}
          </button>
          <button className="btn primary" onClick={() => nav("/")}>
            처음으로
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="card" style={{ marginTop: 12 }}>
          기록이 없어요.
        </div>
      ) : (
        records.map((r, i) => (
          <div key={r.ts + "-" + i} className="card" style={{ marginTop: 12 }}>
            <div className="muted" style={{ marginBottom: 6 }}>
              {r.mode?.toUpperCase?.?.() || r.mode} · Day {r.day} · Q{r.qid} · {r.date}
            </div>
            <div style={{ marginBottom: 6 }}>
              {/* 정답 토큰을 오답만 또는 전체로 표시 */}
              {r.enChunks.map((tok, idx) => {
                const wrong = r.wrongIdxs?.includes(idx);
                if (showWrongOnly && !wrong) return null;
                return (
                  <span
                    key={idx}
                    className={wrong ? "word-bad" : "word-ok"}
                    style={{ marginRight: 6 }}
                  >
                    {tok}
                  </span>
                );
              })}
            </div>
            <div className="muted">
              점수: {r.score} / {r.totalChunks} (
              {r.totalChunks ? Math.round((r.score / r.totalChunks) * 100) : 0}%)
            </div>
            <details style={{ marginTop: 6 }}>
              <summary className="muted">내 답 보기</summary>
              <div style={{ marginTop: 4 }}>{r.user}</div>
            </details>
          </div>
        ))
      )}
    </div>
  );
}
