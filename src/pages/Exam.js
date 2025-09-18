// src/pages/Exam.js
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { QUESTIONS } from "../data";

// ---- 유틸 ----
const norm = (s) =>
  (s ?? "")
    .toLowerCase()
    .replace(/[.,!?;:"'()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (s) => norm(s).split(" ").filter(Boolean);

// ---- 컴포넌트 ----
export default function Exam() {
  const nav = useNavigate();
  const { day } = useParams();
  const { state } = useLocation();

  const [idx, setIdx] = useState(0);
  // phase: 'speak' -> 'write'
  const [phase, setPhase] = useState("speak");
  const [ans, setAns] = useState("");

  // 채점 결과 표시용
  const [result, setResult] = useState(null); // { expectedTokens, wrongIdxs, score, total }

  const list = useMemo(() => QUESTIONS[day] || [], [day]);
  const q = list[idx];

  // 브라우저 음성인식 준비
  const recRef = useRef(null);
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text =
        (e.results?.[0]?.[0]?.transcript || "").toString();
      setAns(text);                 // 1) 인식된 문장 보여주기
      handleAutoCheck(text);        // 2) 자동 채점 + 기록
    };
    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch (_) {}
      recRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!q) {
    return (
      <div className="container">
        <div className="card">
          <h2>문제가 없어요</h2>
        </div>
      </div>
    );
  }

  // 채점 공통 함수
  const check = (text) => {
    const expectedTokens = tokenize(q.enChunks.join(" "));
    const userTokens = tokenize(text);

    const wrongIdxs = [];
    expectedTokens.forEach((exp, i) => {
      const user = userTokens[i] || "";
      if (user === exp) return;
      // 복수형 오차 허용
      if (user + "s" === exp || user === exp + "s") return;
      wrongIdxs.push(i);
    });
    const score = expectedTokens.length - wrongIdxs.length;
    return { expectedTokens, wrongIdxs, score, total: expectedTokens.length };
  };

  // 로컬 기록
  const saveRecord = ({ mode, res, text }) => {
    const rec = {
      name: state?.name || "",
      date: state?.date || new Date().toISOString().slice(0, 10),
      day,
      qid: q.id,
      mode, // 'speak' or 'write'
      koChunks: q.koChunks,
      enChunks: res.expectedTokens,
      full: q.full,
      user: text,
      wrongIdxs: res.wrongIdxs,
      score: res.score,
      totalChunks: res.total,
      ts: Date.now(),
    };
    const prev = JSON.parse(localStorage.getItem("records") || "[]");
    localStorage.setItem("records", JSON.stringify([...prev, rec]));
  };

  // 말하기 → 자동채점
  const handleSpeak = () => {
    if (!recRef.current) {
      alert("이 브라우저는 음성 인식을 지원하지 않아요. (Chrome 권장)");
      return;
    }
    setResult(null);
    setAns("");
    try { recRef.current.start(); } catch (_) {}
  };

  const handleAutoCheck = (text) => {
    const res = check(text);
    setResult(res);
    saveRecord({ mode: "speak", res, text });
    // 자동채점 후 결과 보이기 + '다음 단계(쓰기)' 버튼으로 이동 준비
  };

  // 쓰기 채점 (버튼 클릭)
  const handleWriteCheck = () => {
    const res = check(ans);
    setResult(res);
    saveRecord({ mode: "write", res, text: ans });
    // 쓰기 채점 후 '다음 문제' 버튼 노출
  };

  // 다음 단계(쓰기)
  const goWritePhase = () => {
    setPhase("write");
    setResult(null);
    setAns(""); // 학생이 스스로 타이핑
  };

  // 다음 문제 or 결과 화면
  const goNext = () => {
    if (idx < list.length - 1) {
      setIdx((v) => v + 1);
      setPhase("speak");
      setAns("");
      setResult(null);
    } else {
      nav("/result", {
        state: {
          name: state?.name || "",
          date: state?.date || new Date().toISOString().slice(0, 10),
          day,
        },
      });
    }
  };

  // 표시용: 한글 프롬프트를 슬래시로
  const koLine =
    q.koChunks?.length ? q.koChunks.join(" / ") : (q.ko || "");

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">
          문제 {idx + 1} / {list.length}
        </h1>

        <p className="yellow">{koLine}</p>

        {/* 입력 영역 */}
        {phase === "speak" ? (
          // 말하기 단계: 인식된 문장 보여주지만 수정은 못 하게
          <textarea
            placeholder="말하기 버튼을 누르고 말해 보세요 (자동 채점)"
            value={ans}
            readOnly
            rows={3}
          />
        ) : (
          // 쓰기 단계: 학생이 직접 타이핑 후 채점
          <textarea
            placeholder="영어로 문장을 쓰세요"
            value={ans}
            onChange={(e) => setAns(e.target.value)}
            rows={3}
          />
        )}

        {/* 결과 비교 (청크 단위 색상) */}
        {result && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="muted" style={{ marginBottom: 6 }}>
              정답 비교
            </div>
            <div>
              {result.expectedTokens.map((tok, i) => (
                <span
                  key={i}
                  className={result.wrongIdxs.includes(i) ? "word-bad" : "word-ok"}
                  style={{ marginRight: 6 }}
                >
                  {tok}
                </span>
              ))}
            </div>
            <div className="muted" style={{ marginTop: 8 }}>
              점수: {result.score} / {result.total} (
              {Math.round((result.score / result.total) * 100)}%)
            </div>
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="nav">
          {phase === "speak" ? (
            <>
              <button className="btn purple" onClick={handleSpeak}>
                말하기
              </button>
              <button
                className="btn success"
                onClick={goWritePhase}
                disabled={!result} // 자동채점 결과 나오면 쓰기로 이동
              >
                다음 단계(쓰기)
              </button>
            </>
          ) : (
            <>
              <button className="btn primary" onClick={handleWriteCheck}>
                채점하기
              </button>
              <button
                className="btn success"
                onClick={goNext}
                disabled={!result} // 쓰기 채점 결과가 있어야 다음
              >
                다음 문제
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
