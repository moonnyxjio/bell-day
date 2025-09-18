// src/pages/Records.js
import React, { useEffect, useState } from "react";

export default function Records() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem("records") || "[]");
      setRecords(Array.isArray(data) ? data.slice().reverse() : []);
    } catch {
      setRecords([]);
    }
  }, []);

  const clearAll = () => {
    if (!window.confirm("모든 기록을 삭제할까요?")) return;
    localStorage.setItem("records", "[]");
    setRecords([]);
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">기록</h1>
        <div className="nav" style={{ marginTop: 8 }}>
          <button className="btn danger" onClick={clearAll}>전체 삭제</button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="card" style={{ marginTop: 12 }}>아직 기록이 없어요.</div>
      ) : (
        records.map((r, i) => (
          <div key={r.ts + "-" + i} className="card" style={{ marginTop: 12 }}>
            <div className="muted" style={{ marginBottom: 6 }}>
              {r.name} · {r.date} · Day {r.day} · Q{r.qid} · {r.mode}
            </div>
            <div style={{ marginBottom: 6 }}>
              {r.enChunks?.map((tok, idx) => (
                <span
                  key={idx}
                  className={r.wrongIdxs?.includes(idx) ? "word-bad" : "word-ok"}
                  style={{ marginRight: 6 }}
                >
                  {tok}
                </span>
              ))}
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
