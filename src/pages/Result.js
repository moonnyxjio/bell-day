// src/pages/Result.js
import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QUESTIONS } from "../data";

function uniq(arr) {
  return Array.from(new Set(arr));
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem("records") || "[]");
  } catch {
    return [];
  }
}

function saveRecords(list) {
  localStorage.setItem("records", JSON.stringify(list));
}

export default function Result() {
  const nav = useNavigate();
  const loc = useLocation();
  const navState = loc.state || {};

  // 전체 기록 로드
  const [records, setRecords] = useState(() => loadRecords());

  // 필터 상태
  const [nameFilter, setNameFilter] = useState(navState.name || "");
  const [dayFilter, setDayFilter] = useState(navState.day || "");

  // 필터 옵션
  const nameOptions = useMemo(
    () => uniq(records.map((r) => r.name).filter(Boolean)).sort(),
    [records]
  );
  const dayOptions = useMemo(
    () => uniq(records.map((r) => r.day).filter(Boolean)).sort(),
    [records]
  );

  // 필터 적용
  const filtered = useMemo(() => {
    return records
      .filter((r) => (nameFilter ? r.name === nameFilter : true))
      .filter((r) => (dayFilter ? r.day === dayFilter : true))
      .sort((a, b) => b.ts - a.ts);
  }, [records, nameFilter, dayFilter]);

  const totalScore = filtered.reduce((s, r) => s + (r.score || 0), 0);
  const totalChunks = filtered.reduce((s, r) => s + (r.totalChunks || 0), 0);

  // 개별 토글 상태 (정답 보기)
  const [openIds, setOpenIds] = useState({}); // key: ts or index

  const toggleOpen = (key) =>
    setOpenIds((p) => ({ ...p, [key]: !p[key] }));

  // 개별 삭제
  const removeOne = (ts) => {
    const next = records.filter((r) => r.ts !== ts);
    setRecords(next);
    saveRecords(next);
  };

  // 전체 삭제
  const clearAll = () => {
    if (!window.confirm("정말 전체 기록을 삭제할까요?")) return;
    setRecords([]);
    saveRecords([]);
  };

  // Day + (선택된) 학생 기준으로 '틀린 문제만 다시 말하기'
  const retryWrongFiltered = () => {
    if (!dayFilter) {
      alert("Day를 선택해야 해요. (필터에서 Day 선택)");
      return;
    }
    const wrongRecs = filtered.filter((r) => (r.wrongIdxs || []).length > 0 && r.day === dayFilter);
    if (wrongRecs.length === 0) {
      alert("틀린 문제가 없어요!");
      return;
    }
    // qid 기준으로 중복 제거
    const uniqueByQid = {};
    wrongRecs.forEach((r) => {
      uniqueByQid[r.qid] = r;
    });
    const uniqList = Object.values(uniqueByQid);

    // 원본 문제 복구
    const retry = uniqList
      .map((r) => {
        const q = (QUESTIONS[r.day] || []).find((qq) => qq.id === r.qid);
        return q ? { ...q } : null;
      })
      .filter(Boolean);

    nav(`/exam/${dayFilter}`, {
      state: {
        name: nameFilter || uniqList[0]?.name || "",
        date: new Date().toISOString().slice(0, 10),
        day: dayFilter,
        retry,
      },
    });
  };

  // 단일 문제 다시 말하기
  const retryOne = (rec) => {
    const q = (QUESTIONS[rec.day] || []).find((qq) => qq.id === rec.qid);
    if (!q) {
      alert("원본 문제를 찾지 못했어요.");
      return;
    }
    nav(`/exam/${rec.day}`, {
      state: {
        name: rec.name,
        date: rec.date,
        day: rec.day,
        retry: [{ ...q }],
      },
    });
  };

  // UI: 토큰 컬러링
  const renderAnswerTokens = (rec) => {
    return rec.enChunks.map((tok, i) =>
      rec.wrongIdxs.includes(i) ? (
        <span key={i} className="word-bad">{tok}</span>
      ) : (
        <span key={i} className="word-ok">{tok}</span>
      )
    );
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 960 }}>
        <h1 className="title">결과</h1>
        <p className="subtitle">
          {nameFilter ? `${nameFilter} | ` : ""}
          {dayFilter ? `DAY${dayFilter.replace("day", "")}` : ""}
        </p>

        <div className="row" style={{ marginTop: 8 }}>
          {/* 이름 필터 */}
          <select
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #444", background: "#111", color: "#fff" }}
          >
            <option value="">학생 전체</option>
            {nameOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          {/* Day 필터 */}
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #444", background: "#111", color: "#fff" }}
          >
            <option value="">Day 전체</option>
            {dayOptions.map((d) => (
              <option key={d} value={d}>{d.toUpperCase()}</option>
            ))}
          </select>

          <button className="btn" onClick={() => { setNameFilter(""); setDayFilter(""); }}>
            필터 초기화
          </button>

          <button className="btn danger" onClick={clearAll}>
            전체 기록 삭제
          </button>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn success" onClick={retryWrongFiltered}>
            (필터된) 틀린 문제만 다시 말하기
          </button>
          <button className="btn" onClick={() => nav("/")}>처음으로</button>
        </div>

        <div style={{ marginTop: 16 }} className="muted">
          점수 합계: {totalScore} / {totalChunks}{" "}
          {totalChunks ? `(${Math.round((totalScore / totalChunks) * 100)}%)` : ""}
        </div>

        {/* 세로 리스트 */}
        <div style={{ marginTop: 16 }}>
          {filtered.length === 0 && <p className="muted">표시할 기록이 없어요.</p>}

          {filtered.map((r, i) => {
            const key = r.ts || i;
            const opened = !!openIds[key];
            return (
              <div
                key={key}
                style={{
                  border: "1px solid #333",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  background: "#0d0f14",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div className="muted" style={{ marginBottom: 6 }}>
                      {r.name || "학생"} · {r.date} · {r.day.toUpperCase()} · Q{r.qid}
                    </div>
                    <div>
                      점수: <b>{r.score}</b> / {r.totalChunks}{" "}
                      {r.totalChunks ? `(${Math.round((r.score / r.totalChunks) * 100)}%)` : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={() => toggleOpen(key)}>
                      {opened ? "정답 감추기" : "정답 보기"}
                    </button>
                    <button className="btn primary" onClick={() => retryOne(r)}>
                      이 문제 다시 말하기
                    </button>
                    <button className="btn danger" onClick={() => removeOne(r.ts)}>
                      삭제
                    </button>
                  </div>
                </div>

                {opened && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 6 }}>
                      <div className="muted">정답 문장:</div>
                      <div style={{ lineHeight: "2.0" }}>{renderAnswerTokens(r)}</div>
                    </div>
                    <div>
                      <div className="muted">학생 답안:</div>
                      <div style={{ border: "1px solid #333", padding: "8px 12px", borderRadius: 8 }}>
                        {r.user || ""}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
