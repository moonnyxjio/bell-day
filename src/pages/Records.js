// src/pages/Result.js
import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QUESTIONS } from "../data";

// ----- 통과(마스터) 저장소 -----
const MASTER_KEY = "mastery_v1";
const loadMastery = () => {
  try { return JSON.parse(localStorage.getItem(MASTER_KEY) || "{}"); }
  catch { return {}; }
};
const isMastered = (name, day, qid) => {
  const db = loadMastery();
  const keyName = name || "_anon";
  const keyDay = day || "_day";
  const arr = db[keyName]?.[keyDay] || [];
  return arr.includes(qid);
};

// ----- UI 토큰 렌더 -----
const Tokens = ({ tokens, wrongIdxs }) => (
  <span style={{ display: "inline-block", lineHeight: "1.9" }}>
    {tokens.map((t, i) =>
      wrongIdxs.includes(i) ? (
        <span key={i} className="word-bad">{t}</span>
      ) : (
        <span key={i} className="word-ok">{t}</span>
      )
    )}
  </span>
);

export default function Result() {
  const nav = useNavigate();
  const { state } = useLocation(); // { name?, day? }
  const [nameFilter, setNameFilter] = useState(state?.name || "");
  const [dayFilter, setDayFilter]   = useState(state?.day || "");

  // 기록 로드
  const allRecords = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("records") || "[]"); }
    catch { return []; }
  }, []);

  // 필터 옵션
  const nameOptions = useMemo(() =>
    Array.from(new Set(allRecords.map(r => r.name).filter(Boolean))).sort(),
    [allRecords]
  );
  const dayOptions = useMemo(() =>
    Array.from(new Set(allRecords.map(r => r.day).filter(Boolean))).sort(),
    [allRecords]
  );

  // 필터 적용
  const filtered = useMemo(() => {
    const list = allRecords
      .filter(r => (nameFilter ? r.name === nameFilter : true))
      .filter(r => (dayFilter ? r.day === dayFilter : true))
      .sort((a, b) => b.ts - a.ts);
    return list;
  }, [allRecords, nameFilter, dayFilter]);

  // “선생님 입장 남은 오답” 계산:
  // 같은 QID가 여러 기록에 있어도, “통과 성공”이면 오답 목록에서 제외.
  const remainingWrong = useMemo(() => {
    if (!nameFilter || !dayFilter) return [];
    // 그 Day의 전체 문항 QID 목록
    const qs = (QUESTIONS[dayFilter] || []);
    const qidSet = new Set(qs.map(q => q.id));
    // 해당 학생/Day의 “마스터되지 않은” QID만 남김
    const notMasteredQids = Array.from(qidSet).filter(qid => !isMastered(nameFilter, dayFilter, qid));

    // 그 QID들에 대한 최근 기록(있을 수도/없을 수도)
    const latestByQid = {};
    filtered.forEach(r => {
      if (r.day !== dayFilter || r.name !== nameFilter) return;
      if (!qidSet.has(r.qid)) return;
      if (!latestByQid[r.qid] || r.ts > latestByQid[r.qid].ts) latestByQid[r.qid] = r;
    });

    // 아직 마스터 안 된 QID만 보여주기
    const items = notMasteredQids.map(qid => {
      const rec = latestByQid[qid];
      if (rec) return rec; // 최근 기록이 있으면 그걸 사용(오답 표시 가능)
      // 기록이 없다면 문제 원본만 준비
      const q = qs.find(qq => qq.id === qid);
      return q
        ? {
            name: nameFilter,
            day: dayFilter,
            qid,
            koChunks: q.koChunks,
            enChunks: q.enChunks,
            wrongIdxs: q.enChunks.map(()=>0), // 표시용
            score: 0,
            totalChunks: q.enChunks.join(" ").trim().split(/\s+/).length,
            user: "",
            ts: 0,
          }
        : null;
    }).filter(Boolean);

    return items;
  }, [filtered, nameFilter, dayFilter]);

  // 통과률/배지
  const masteryInfo = useMemo(() => {
    if (!nameFilter || !dayFilter) return null;
    const qs = QUESTIONS[dayFilter] || [];
    const total = qs.length;
    const mastered = qs.filter(q => isMastered(nameFilter, dayFilter, q.id)).length;
    const left = Math.max(total - mastered, 0);
    const pct = total ? Math.round((mastered / total) * 100) : 0;
    return { mastered, total, left, pct, done: total > 0 && mastered === total };
  }, [nameFilter, dayFilter]);

  // 오답만 다시 말하기 (남은 오답 QID 기준)
  const retryWrong = () => {
    if (!nameFilter || !dayFilter) {
      alert("학생과 Day를 먼저 선택하세요.");
      return;
    }
    if (!remainingWrong.length) {
      alert("남은 오답이 없어요! (모두 통과)");
      return;
    }
    // 남은 오답 QID → 원본 문제로 재구성
    const retry = remainingWrong.map(r => {
      const qq = (QUESTIONS[dayFilter] || []).find(x => x.id === r.qid);
      return qq ? { ...qq } : null;
    }).filter(Boolean);

    nav(`/exam/${dayFilter}`, {
      state: {
        name: nameFilter,
        day: dayFilter,
        date: new Date().toISOString().slice(0,10),
        retry,
      },
    });
  };

  // 개별 카드에서 해당 문제만 다시
  const retryOne = (rec) => {
    const q = (QUESTIONS[rec.day] || []).find(qq => qq.id === rec.qid);
    if (!q) return alert("원본 문제를 찾지 못했어요.");
    nav(`/exam/${rec.day}`, {
      state: { name: rec.name, day: rec.day, date: rec.date, retry: [{ ...q }] },
    });
  };

  // 점수 집계 (참고용)
  const totalScore = filtered.reduce((s, r) => s + (r.score || 0), 0);
  const totalChunks = filtered.reduce((s, r) => s + (r.totalChunks || 0), 0);

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
        </div>

        {/* 상단 요약 / 배지 */}
        {nameFilter && dayFilter && masteryInfo && (
          <div className="card" style={{ marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 700 }}>
                {nameFilter} · {String(dayFilter).toUpperCase()}
              </div>
              <div className="muted">
                통과 {masteryInfo.mastered}/{masteryInfo.total} (남은 오답 {masteryInfo.left})
              </div>
              <div className="muted">
                진행률 {masteryInfo.pct}%
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
            </div>
          </div>
        )}

        {/* 필터된 기록(최근순) 간단 합계 */}
        <div className="muted" style={{ marginTop: 10 }}>
          (참고) 점수 합계: {totalScore} / {totalChunks}{totalChunks ? ` (${Math.round((totalScore/totalChunks)*100)}%)` : ""}
        </div>

        {/* 남은 오답 리스트 (선생님이 바로 확인) */}
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
                    <div>
                      <Tokens tokens={r.enChunks || []} wrongIdxs={r.wrongIdxs || []} />
                    </div>
                    <div className="nav" style={{ marginTop: 8 }}>
                      <button className="btn primary" onClick={()=>retryOne(r)}>이 문제 다시 말하기</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 일반 기록 리스트 (필터 반영, 최근순) */}
        <div style={{ marginTop: 12 }}>
          {!filtered.length ? (
            <div className="card">표시할 기록이 없어요.</div>
          ) : (
            filtered.map((r) => (
              <div key={r.ts} className="card" style={{ marginBottom: 10 }}>
                <div className="muted" style={{ marginBottom: 6 }}>
                  {r.name || "학생"} · {r.date} · {String(r.day).toUpperCase()} · Q{r.qid}
                </div>
                <div style={{ marginBottom: 6, fontWeight: 600 }}>
                  {r.koChunks?.join(" / ")}
                </div>
                <Tokens tokens={r.enChunks || []} wrongIdxs={r.wrongIdxs || []} />
                <div className="muted" style={{ marginTop: 6 }}>
                  점수 {r.score}/{r.totalChunks}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
