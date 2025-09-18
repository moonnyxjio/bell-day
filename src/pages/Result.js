// src/pages/Result.js
import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QUESTIONS } from "../data";

// ----- 관리자 PIN -----
const ADMIN_PIN = "jchi";
const isAdminSession = () => sessionStorage.getItem("admin_ok") === "1";
const setAdminSession = (ok) => {
  if (ok) sessionStorage.setItem("admin_ok", "1");
  else sessionStorage.removeItem("admin_ok");
};

// ----- 통과(마스터) DB -----
const MASTER_KEY = "mastery_v1";
const loadMastery = () => {
  try { return JSON.parse(localStorage.getItem(MASTER_KEY) || "{}"); }
  catch { return {}; }
};
const isMastered = (name, day, qid) => {
  const db = loadMastery();
  const arr = db[name || "_anon"]?.[day || "_day"] || [];
  return arr.includes(qid);
};

// UI 토큰 렌더
const Tokens = ({ tokens, wrongIdxs }) => (
  <span style={{ display: "inline-block", lineHeight: "1.9" }}>
    {tokens.map((t, i) =>
      wrongIdxs.includes(i)
        ? <span key={i} className="word-bad">{t}</span>
        : <span key={i} className="word-ok">{t}</span>
    )}
  </span>
);

export default function Result() {
  const nav = useNavigate();
  const { state } = useLocation(); // { name?, day? }
  const [nameFilter, setNameFilter] = useState(state?.name || "");
  const [dayFilter, setDayFilter]   = useState(state?.day || "");
  const [admin, setAdmin] = useState(isAdminSession());

  const allRecords = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("records") || "[]"); }
    catch { return []; }
  }, []);

  const nameOptions = useMemo(
    () => Array.from(new Set(allRecords.map(r => r.name).filter(Boolean))).sort(),
    [allRecords]
  );
  const dayOptions = useMemo(
    () => Array.from(new Set(allRecords.map(r => r.day).filter(Boolean))).sort(),
    [allRecords]
  );

  const filtered = useMemo(() => {
    return allRecords
      .filter(r => (nameFilter ? r.name === nameFilter : true))
      .filter(r => (dayFilter ? r.day === dayFilter : true))
      .sort((a, b) => b.ts - a.ts);
  }, [allRecords, nameFilter, dayFilter]);

  const remainingWrong = useMemo(() => {
    if (!nameFilter || !dayFilter) return [];
    const qs = (QUESTIONS[dayFilter] || []);
    const qidSet = new Set(qs.map(q => q.id));

    const notMasteredQids = [...qidSet].filter(qid => !isMastered(nameFilter, dayFilter, qid));

    const latestByQid = {};
    filtered.forEach(r => {
      if (r.day !== dayFilter || r.name !== nameFilter) return;
      if (!qidSet.has(r.qid)) return;
      if (!latestByQid[r.qid] || r.ts > latestByQid[r.qid].ts) latestByQid[r.qid] = r;
    });

    return notMasteredQids
      .map(qid => latestByQid[qid] || (() => {
        const q = qs.find(qq => qq.id === qid);
        if (!q) return null;
        return {
          name: nameFilter, day: dayFilter, qid,
          koChunks: q.koChunks, enChunks: q.enChunks,
          wrongIdxs: q.enChunks.map(() => 0),
          score: 0, totalChunks: q.enChunks.join(" ").trim().split(/\s+/).length,
          user: "", ts: 0
        };
      })())
      .filter(Boolean);
  }, [filtered, nameFilter, dayFilter]);

  const masteryInfo = useMemo(() => {
    if (!nameFilter || !dayFilter) return null;
    const qs = QUESTIONS[dayFilter] || [];
    const total = qs.length;
    const mastered = qs.filter(q => isMastered(nameFilter, dayFilter, q.id)).length;
    const pct = total ? Math.round((mastered / total) * 100) : 0;
    return { mastered, total, left: Math.max(total - mastered, 0), pct, done: total > 0 && mastered === total };
  }, [nameFilter, dayFilter]);

  // 관리자 인증
  const ensureAdmin = () => {
    if (admin) return true;
    const pin = window.prompt("관리자 PIN을 입력하세요:");
    if (pin === ADMIN_PIN) {
      setAdmin(true);
      setAdminSession(true);
      return true;
    }
    if (pin !== null) alert("PIN이 올바르지 않습니다.");
    return false;
  };

  // 삭제 동작들 (관리자만)
  const deleteOne = (ts) => {
    if (!ensureAdmin()) return;
    const next = allRecords.filter((r) => r.ts !== ts);
    localStorage.setItem("records", JSON.stringify(next));
    window.location.reload();
  };
  const deleteFiltered = () => {
    if (!ensureAdmin()) return;
    if (!filtered.length) return;
    if (!window.confirm(`필터된 ${filtered.length}개 기록을 삭제할까요?`)) return;
    const del = new Set(filtered.map(r => r.ts));
    const next = allRecords.filter(r => !del.has(r.ts));
    localStorage.setItem("records", JSON.stringify(next));
    window.location.reload();
  };
  const clearAll = () => {
    if (!ensureAdmin()) return;
    if (!window.confirm("모든 기록을 삭제할까요?")) return;
    localStorage.removeItem("records");
    window.location.reload();
  };

  const retryWrong = () => {
    if (!nameFilter || !dayFilter) { alert("학생과 Day를 먼저 선택하세요."); return; }
    if (!remainingWrong.length) { alert("남은 오답이 없어요!"); return; }
    const retry = remainingWrong
      .map(r => (QUESTIONS[dayFilter] || []).find(x => x.id === r.qid))
      .filter(Boolean)
      .map(q => ({ ...q }));
    nav(`/exam/${dayFilter}`, {
      state: { name: nameFilter, day: dayFilter, date: new Date().toISOString().slice(0,10), retry }
    });
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 980 }}>
        <h1 className="title">결과 (선생님용)</h1>

        {/* 필터 */}
        <div className="row" style={{ gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          <select value={nameFilter} onChange={(e)=>setNameFilter(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #444", background: "#111", color: "#fff" }}>
            <option value="">학생 전체</option>
            {nameOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={dayFilter} onChange={(e)=>setDayFilter(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #444", background: "#111", color: "#fff" }}>
            <option value="">Day 전체</option>
            {dayOptions.map(d => <option key={d} value={d}>{String(d).toUpperCase()}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={()=>nav("/")}>처음으로</button>

          {/* 관리자 메뉴 */}
          {!admin ? (
            <button className="btn danger" onClick={ensureAdmin}>관리자 로그인</button>
          ) : (
            <button className="btn" onClick={()=>{ setAdmin(false); setAdminSession(false); }}>
              로그아웃
            </button>
          )}
        </div>

        {/* 요약/배지 + 남은 오답 */}
        {nameFilter && dayFilter && masteryInfo && (
          <div className="card" style={{ marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 700 }}>
                {nameFilter} · {String(dayFilter).toUpperCase()}
              </div>
              <div className="muted">
                통과 {masteryInfo.mastered}/{masteryInfo.total} · 남은 오답 {masteryInfo.left} · 진행률 {masteryInfo.pct}%
              </div>
              {masteryInfo.done && (
                <span style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#22c55e22",
                  border: "1px solid #22c55e",
                  color: "#22c55e",
                  fontWeight: 700
                }}>
                  ✅ DAY 완료 배지
                </span>
              )}
              <div style={{ flex: 1 }} />
              <button className="btn success" onClick={retryWrong}>남은 오답만 다시</button>
              {admin && (
                <>
                  <button className="btn danger" onClick={deleteFiltered}>필터된 기록 삭제</button>
                  <button className="btn danger" onClick={clearAll}>전체 삭제</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* 남은 오답 리스트 */}
        {nameFilter && dayFilter && (
          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              남은 오답 목록 ({remainingWrong.length}개)
            </div>
            {remainingWrong.length === 0 ? (
              <div className="muted">남은 오답이 없어요.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {remainingWrong.map((r) => (
                  <div key={r.qid} style={{ border: "1px solid #333", borderRadius: 10, padding: 10 }}>
                    <div className="muted" style={{ marginBottom: 6 }}>
                      Q{r.qid} · {String(r.day).toUpperCase()} · {r.name}
                    </div>
                    <div style={{ marginBottom: 6, fontWeight: 600 }}>
                      {r.koChunks?.join(" / ")}
                    </div>
                    <div><Tokens tokens={r.enChunks || []} wrongIdxs={r.wrongIdxs || []} /></div>
                    <div className="nav" style={{ marginTop: 8 }}>
                      <button className="btn primary" onClick={()=>{
                        const q = (QUESTIONS[r.day] || []).find(qq=>qq.id===r.qid);
                        if (!q) return alert("원본 문제를 찾지 못했어요.");
                        nav(`/exam/${r.day}`, { state: { name: r.name, day: r.day, date: r.date, retry: [{...q}] }});
                      }}>
                        이 문제 다시 말하기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 일반 기록 리스트 (개별 삭제는 '관리자'에게만 노출) */}
        <div style={{ marginTop: 12 }}>
          {!filtered.length ? (
            <div className="card">표시할 기록이 없어요.</div>
          ) : (
            filtered.map((r) => {
              const wrong = new Set(r.wrongIdxs || []);
              return (
                <div key={r.ts} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <div className="muted">
                      {r.name || "학생"} · {r.date} · {String(r.day).toUpperCase()} · Q{r.qid}
                    </div>
                    <div>
                      {r.score}/{r.totalChunks}{" "}
                      <span style={{ color: wrong.size ? "#ff6b6b" : "#22c55e", fontWeight: 700 }}>
                        {wrong.size ? "오답" : "정답"}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: 14, marginBottom: 6, opacity: 0.85 }}>
                    {r.koChunks?.join(" / ")}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(r.enChunks || []).map((w, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 8,
                          border: "1px solid",
                          borderColor: wrong.has(idx) ? "#ff6b6b" : "#22c55e",
                        }}
                      >
                        {w}
                      </span>
                    ))}
                  </div>

                  <div className="muted" style={{ marginTop: 6 }}>
                    학생 답안: {r.user}
                  </div>

                  {admin && (
                    <div className="row" style={{ justifyContent: "flex-end", marginTop: 8 }}>
                      <button className="btn danger" onClick={() => deleteOne(r.ts)}>삭제</button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
