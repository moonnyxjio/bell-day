// src/pages/Records.js
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QUESTIONS } from "../data";

// ----- 관리자 PIN 보호 -----
const ADMIN_PIN = "jchi";
const isAdminSession = () => sessionStorage.getItem("admin_ok") === "1";
const setAdminSession = (ok) => {
  if (ok) sessionStorage.setItem("admin_ok", "1");
  else sessionStorage.removeItem("admin_ok");
};

// ----- Mastery 저장소 -----
const MASTER_KEY = "mastery_v1";
const loadMastery = () => {
  try { return JSON.parse(localStorage.getItem(MASTER_KEY) || "{}"); }
  catch { return {}; }
};
const saveMastery = (obj) => localStorage.setItem(MASTER_KEY, JSON.stringify(obj));

// ----- Records -----
const loadRecords = () => {
  try { return JSON.parse(localStorage.getItem("records") || "[]"); }
  catch { return []; }
};
const saveRecords = (list) => localStorage.setItem("records", JSON.stringify(list));

// 유틸
const uniq = (arr) => Array.from(new Set(arr));
const sortDays = (arr) =>
  [...arr].sort((a, b) => {
    const na = parseInt(String(a).replace(/\D/g, "") || "0", 10);
    const nb = parseInt(String(b).replace(/\D/g, "") || "0", 10);
    return na - nb;
  });

export default function Records() {
  const nav = useNavigate();

  // 상태: records는 수정 가능하게 useState로
  const [records, setRecords] = useState(() => {
    const a = loadRecords();
    a.sort((x, y) => y.ts - x.ts);
    return a;
  });
  const [mastery] = useState(() => loadMastery());

  const [admin, setAdmin] = useState(isAdminSession());

  // 전체 목록
  const allNames = useMemo(() => {
    const namesFromRec = records.map((r) => (r.name || "").trim()).filter(Boolean);
    const namesFromMaster = Object.keys(mastery || {});
    return uniq([...namesFromRec, ...namesFromMaster]).sort((a, b) => a.localeCompare(b, "ko"));
  }, [records, mastery]);

  const allDays = useMemo(() => {
    const qDays = Object.keys(QUESTIONS || {});
    const recDays = uniq(records.map((r) => r.day).filter(Boolean));
    return sortDays(uniq([...qDays, ...recDays]));
  }, [records]);

  // 필터
  const [selNames, setSelNames] = useState(new Set());
  const [selDays, setSelDays] = useState(new Set());
  const toggleSet = (s, v) => {
    const n = new Set(s);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    return n;
  };

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const okN = selNames.size === 0 || selNames.has(r.name);
      const okD = selDays.size === 0 || selDays.has(r.day);
      return okN && okD;
    });
  }, [records, selNames, selDays]);

  // 배지용 집계
  const masteredBy = useMemo(() => {
    // mastery: { [name]: { [day]: [qid...] } }
    const map = {};
    Object.entries(mastery || {}).forEach(([name, byDay]) => {
      map[name] = {};
      Object.entries(byDay || {}).forEach(([day, qids]) => {
        map[name][day] = new Set(qids || []);
      });
    });
    return map;
  }, [mastery]);

  const studentCards = useMemo(() => {
    return allNames.map((name) => {
      const days = allDays.map((day) => {
        const totalQs = (QUESTIONS[day] || []).length;
        const masteredSet = masteredBy?.[name]?.[day] || new Set();
        const mastered = masteredSet.size;
        const done = totalQs > 0 && mastered === totalQs;
        const onClick = () => {
          setSelNames(new Set([name]));
          setSelDays(new Set([day]));
          window.scrollTo({ top: 0, behavior: "smooth" });
        };
        return { day, totalQs, mastered, done, onClick };
      });
      return { name, days };
    });
  }, [allNames, allDays, masteredBy]);

  // 요약
  const totals = useMemo(() => {
    const total = filtered.length;
    const sum = filtered.reduce((a, b) => a + (b.score || 0), 0);
    const chunks = filtered.reduce((a, b) => a + (b.totalChunks || 0), 0);
    return { total, sum, chunks, pct: chunks ? Math.round((sum / chunks) * 100) : 0 };
  }, [filtered]);

  // 스타일
  const badgeStyle = (done) => ({
    padding: "4px 10px",
    borderRadius: 999,
    border: `1px solid ${done ? "#22c55e" : "#666"}`,
    background: done ? "#22c55e22" : "transparent",
    color: done ? "#22c55e" : "#bbb",
    fontWeight: 700,
    cursor: "pointer",
  });
  const pill = {
    padding: "4px 10px",
    border: "1px solid #2e2e2e",
    borderRadius: 999,
    cursor: "pointer",
  };

  // ----- 관리자 인증/삭제 동작 -----
  const ensureAdmin = () => {
    if (admin) return true;
    const pin = window.prompt("관리자 PIN을 입력하세요:");
    if (pin === ADMIN_PIN) {
      setAdminSession(true);
      setAdmin(true);
      alert("관리자 모드로 전환되었습니다.");
      return true;
    }
    if (pin !== null) alert("PIN이 올바르지 않습니다.");
    return false;
  };

  const deleteOne = (ts) => {
    if (!ensureAdmin()) return;
    const next = records.filter((r) => r.ts !== ts);
    setRecords(next);
    saveRecords(next);
  };

  const deleteFiltered = () => {
    if (!ensureAdmin()) return;
    if (!filtered.length) return;
    if (!window.confirm(`필터된 ${filtered.length}개 기록을 삭제할까요?`)) return;
    const del = new Set(filtered.map((r) => r.ts));
    const next = records.filter((r) => !del.has(r.ts));
    setRecords(next);
    saveRecords(next);
  };

  const clearAllRecords = () => {
    if (!ensureAdmin()) return;
    if (!window.confirm("모든 기록(records)을 삭제할까요?")) return;
    setRecords([]);
    saveRecords([]);
  };

  const clearMastery = () => {
    if (!ensureAdmin()) return;
    if (!window.confirm("모든 뱃지 데이터(mastery_v1)를 초기화할까요?")) return;
    saveMastery({});
    alert("뱃지 데이터가 초기화되었습니다. (기록은 유지됨)");
    // 화면 갱신은 필요할 때 새로고침 or 뱃지 계산을 위한 상태 업데이트가 필요하지만
    // 간단히 새로고침:
    window.location.reload();
  };

  return (
    <div className="container">
      <div className="card" style={{ width: "100%", maxWidth: 1000 }}>
        <h1 className="title">대시보드 (선생님)</h1>
        <div className="muted" style={{ marginTop: 6 }}>
          표시 {totals.total}개 · 점수 합계 {totals.sum}/{totals.chunks}
          {totals.chunks ? ` (${totals.pct}%)` : ""}
        </div>

        {/* 상단 메뉴 */}
        <div className="nav" style={{ marginTop: 10, gap: 8, flexWrap: "wrap" }}>
          <button className="btn" onClick={() => nav("/")}>처음으로</button>
          <button className="btn" onClick={() => nav("/badges")}>뱃지 보관함</button>

          {/* 관리자 컨트롤 */}
          {!admin ? (
            <button className="btn danger" onClick={ensureAdmin}>관리자 로그인</button>
          ) : (
            <>
              <button className="btn" onClick={() => { setAdmin(false); setAdminSession(false); }}>
                로그아웃
              </button>
              <button className="btn danger" onClick={deleteFiltered}>
                (관리자) 필터된 기록 삭제
              </button>
              <button className="btn danger" onClick={clearAllRecords}>
                (관리자) 모든 기록 삭제
              </button>
              <button className="btn danger" onClick={clearMastery}>
                (관리자) 뱃지 데이터 초기화
              </button>
            </>
          )}
        </div>

        {/* 필터 패널 */}
        <div
          style={{
            marginTop: 14,
            border: "1px solid #2e2e2e",
            borderRadius: 12,
            padding: 12,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>필터</div>

          {/* 학생 필터 */}
          <div style={{ marginBottom: 10 }}>
            <div className="muted" style={{ marginBottom: 6 }}>학생</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span
                style={{
                  ...pill,
                  borderColor: selNames.size === 0 ? "#22c55e" : "#2e2e2e",
                  color: selNames.size === 0 ? "#22c55e" : undefined,
                }}
                onClick={() => setSelNames(new Set())}
              >
                전체
              </span>
              {allNames.map((nm) => (
                <span
                  key={nm}
                  style={{
                    ...pill,
                    borderColor: selNames.has(nm) ? "#22c55e" : "#2e2e2e",
                    color: selNames.has(nm) ? "#22c55e" : undefined,
                  }}
                  onClick={() => setSelNames((s) => toggleSet(s, nm))}
                >
                  {nm}
                </span>
              ))}
            </div>
          </div>

          {/* Day 필터 */}
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Day</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span
                style={{
                  ...pill,
                  borderColor: selDays.size === 0 ? "#22c55e" : "#2e2e2e",
                  color: selDays.size === 0 ? "#22c55e" : undefined,
                }}
                onClick={() => setSelDays(new Set())}
              >
                전체
              </span>
              {allDays.map((dy) => (
                <span
                  key={dy}
                  style={{
                    ...pill,
                    borderColor: selDays.has(dy) ? "#22c55e" : "#2e2e2e",
                    color: selDays.has(dy) ? "#22c55e" : undefined,
                  }}
                  onClick={() => setSelDays((s) => toggleSet(s, dy))}
                >
                  {String(dy).toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 학생별 Day 배지 보드 */}
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8 }}>학생별 Day 배지</h3>
          {!studentCards.length ? (
            <div className="muted">표시할 학생이 없어요.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {studentCards.map((s) => (
                <div key={s.name} style={{ border: "1px solid #2e2e2e", borderRadius: 12, padding: 12 }}>
                  <div style={{ fontWeight: 800, marginBottom: 10 }}>{s.name}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {s.days.map((d) => (
                      <div key={s.name + d.day} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={badgeStyle(d.done)} onClick={d.onClick}>
                          {String(d.day).toUpperCase()} {d.done ? "✅ 완료" : ""}
                        </span>
                        {!d.done && (
                          <span className="muted">{d.mastered}/{d.totalQs} 진행</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 상세 기록 리스트 */}
        <div style={{ marginTop: 18 }}>
          <h3 style={{ marginBottom: 8 }}>상세 기록</h3>
          {!filtered.length ? (
            <div className="card">조건에 맞는 기록이 없어요.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((r, i) => {
                const wrong = new Set(r.wrongIdxs || []);
                return (
                  <div
                    key={r.ts + "_" + i}
                    style={{
                      border: "1px solid #2e2e2e",
                      borderRadius: 12,
                      padding: 12,
                      background: "var(--card,#111)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
                      <div className="muted">
                        {r.name || "학생"} · {r.date} · {String(r.day).toUpperCase()} · Q{r.qid}
                      </div>
                      <div>
                        {r.score}/{r.totalChunks}{" "}
                        <span
                          style={{
                            color: wrong.size ? "#ff6b6b" : "#22c55e",
                            fontWeight: 700,
                          }}
                        >
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
              })}
            </div>
          )}
        </div>

        {/* 하단 네비 */}
        <div className="nav" style={{ marginTop: 16 }}>
          <button className="btn" onClick={() => nav("/")}>처음으로</button>
        </div>
      </div>
    </div>
  );
}
