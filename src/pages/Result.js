// src/pages/Result.js
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Result() {
  const nav = useNavigate();
  const { state } = useLocation();
  const name = state?.name || "";
  const date = state?.date || "";
  const day = state?.day || "";

  const all = useMemo(
    () => JSON.parse(localStorage.getItem("records") || "[]"),
    []
  );

  // 이번 시험(이름/날짜/데이)에 해당하는 기록만 필터
  const list = useMemo(
    () =>
      all
        .filter((r) => r.name === name && r.date === date && r.day === day)
        // 시간순 정렬(문제 순서대로 보이도록)
        .sort((a, b) => a.ts - b.ts),
    [all, name, date, day]
  );

  const totals = useMemo(() => {
    let correct = 0;
    let total = 0;
    list.forEach((r) => {
      correct += r.score ?? 0;
      total += r.totalChunks ?? 0;
    });
    return { correct, total, pct: total ? Math.round((correct / total) * 100) : 0 };
  }, [list]);

  // 틀린 것만 음성으로 연속 듣기
  const speakWrongOnly = () => {
    if (!("speechSynthesis" in window)) {
      alert("이 브라우저는 음성 출력(speechSynthesis)을 지원하지 않아요.");
      return;
    }
    const wrong = list.filter((r) => (r.wrongIdxs?.length || 0) > 0);
    if (wrong.length === 0) {
      alert("틀린 문장이 없어요! 👍");
      return;
    }
    const q = [...wrong]; // 복사
    const next = () => {
      const rec = q.shift();
      if (!rec) return;
      const u = new SpeechSynthesisUtterance(rec.enChunks.join(" "));
      u.lang = "en-US";
      u.rate = 0.95;
      u.onend = () => next();
      window.speechSynthesis.speak(u);
    };
    next();
  };

  if (!list.length) {
    return (
      <div className="container">
        <div className="card">
          <h1 className="title">결과</h1>
          <p className="subtitle">기록이 없어요. 처음 화면으로 돌아가주세요.</p>
          <div className="nav">
            <button className="btn" onClick={() => nav("/")}>처음으로</button>
          </div>
        </div>
      </div>
    );
  }

  const dayLabel = String(day).toUpperCase();

  return (
    <div className="container">
      <div className="card" style={{ width: "100%", maxWidth: 960 }}>
        <h1 className="title">결과</h1>
        <p className="subtitle" style={{ marginTop: 8 }}>
          {name || "학생"} | {date} | {dayLabel}
        </p>

        <h2 style={{ margin: "16px 0 8px 0" }}>
          점수: {totals.correct}/{totals.total} ({totals.pct}%)
        </h2>

        <div className="nav" style={{ marginTop: 8 }}>
          <button className="btn" onClick={speakWrongOnly}>틀린 것만 듣기</button>
          <button className="btn" onClick={() => nav("/")}>처음으로</button>
        </div>

        {/* 결과 리스트 - 세로 정렬 */}
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
                    {i + 1}. {r.koChunks.join(" / ")}
                  </div>
                  <div>
                    {r.score}/{r.totalChunks}{" "}
                    <span style={{ color: wrong.size ? "#ff6b6b" : "#22c55e", fontWeight: 700 }}>
                      {wrong.size ? "오답" : "정답"}
                    </span>
                  </div>
                </div>

                {/* 정답 문장: 청크별 색상 표시 */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>정답 문장:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(r.enChunks || []).map((w, idx) => (
                      <span
                        key={idx}
                        className={wrong.has(idx) ? "word-bad" : "word-ok"}
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
                  <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>학생 답안:</div>
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
