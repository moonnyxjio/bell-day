// src/pages/Exam.js
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { QUESTIONS } from "../data";

// -------- util --------
const norm = (s = "") =>
  s.toLowerCase().replace(/[.,!?;:"'()]/g, "").replace(/\s+/g, " ").trim();

const tokenize = (s) => norm(s).split(" ").filter(Boolean);

const checkSentence = (expectedChunks, text) => {
  const expectedTokens = tokenize(expectedChunks.join(" "));
  const userTokens = tokenize(text);

  const wrongIdxs = [];
  expectedTokens.forEach((exp, i) => {
    const user = userTokens[i] || "";
    if (user === exp) return;
    if (user + "s" === exp || user === exp + "s") return; // 복수형 허용
    wrongIdxs.push(i);
  });

  return {
    expectedTokens,
    wrongIdxs,
    score: expectedTokens.length - wrongIdxs.length,
    total: expectedTokens.length,
  };
};

const saveRecord = (rec) => {
  const prev = JSON.parse(localStorage.getItem("records") || "[]");
  localStorage.setItem("records", JSON.stringify([...prev, rec]));
};

// -------- component --------
export default function Exam() {
  const nav = useNavigate();
  const { day } = useParams();
  const { state } = useLocation();

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("speak"); // 'speak' -> 'write'
  const [ans, setAns] = useState("");

  const [result, setResult] = useState(null); // { expectedTokens, wrongIdxs, score, total }

  const list = useMemo(() => QUESTIONS[day] || [], [day]);
  const q = list[idx];

  // ----- speech -----
  const recRef = useRef(null);
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = (e.results?.[0]?.[0]?.transcript || "").toString();
      setAns(text);                       // 1) 인식 결과 표시
      const res = checkSentence(q.enChunks, text);
      setResult(res);                     // 2) 자동 채점 즉시 표시
      // 3) 기록 저장 (말하기 단계)
      saveRecord({
        name: state?.name || "",
        date: state?.date || new Date().toISOString().slice(0, 10),
        day,
        qid: q.id,
        mode: "speak",
        koChunks: q.koChunks,
        enChunks: res.expectedTokens,
        full: q.full,
        user: text,
        wrongIdxs: res.wrongIdxs,
        score: res.score,
        totalChunks: res.total,
        ts: Date.now(),
      });
    };
    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
      recRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, day]); // 문제 바뀔 때마다 새 인식기 연결

  if (!q) {
    return (
      <div className="container">
        <div className="card"><h2>문제가 없어요</h2></div>
      </div>
    );
  }

  const handleSpeak = () => {
    if (!recRef.current) {
      alert("이 브라우저는 음성 인식을 지원하지 않아요. (Chrome 권장)");
      return;
    }
    setResult(null);
    setAns("");
    try { recRef.current.start(); } catch {}
  };

  // 쓰기 단계: 입력하면서 즉시 채점 (기록은 '다음 문제' 누를 때 저장)
  const onWriteChange = (v) => {
    setAns(v);
    const res = checkSentence(q.enChunks, v);
    setResult(res);
  };

  const goWritePhase = () => {
    setPhase("write");
    setResult(null);
    setAns("");
  };

  const goNext = () => {
    // 쓰기 단계 점수 기록
    if (phase === "write" && result) {
      saveRecord({
        name: state?.name || "",
        date: state?.date || new Date().toISOString().slice(0, 10),
        day,
        qid: q.id,
        mode: "write",
        koChunks: q.koChunks,
        enChunks: result.expectedTokens,
        full: q.full,
        user: ans,
        wrongIdxs: result.wrongIdxs,
        score: result.score,
        totalChunks: result.total,
        ts: Date.now(),
      });
    }

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

  const koLine = q.koChunks?.length ? q.koChunks.join(" / ") : (q.ko || "");

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">문제 {idx + 1} / {list.length}</h1>
        <p className="yellow">{koLine}</p>

        {phase === "speak" ? (
          <textarea
            placeholder="말하기 버튼을 누르고 말해 보세요 (인식되면 자동 채점)"
            value={ans}
            readOnly
            rows={3}
          />
        ) : (
          <textarea
            placeholder="영어로 문장을 쓰세요 (실시간 채점)"
            value={ans}
            onChange={(e) => onWriteChange(e.target.value)}
            rows={3}
          />
        )}

        {result && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="muted" style={{ marginBottom: 8 }}>
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

        <div className="nav">
          {phase === "speak" ? (
            <>
              <button className="btn purple" onClick={handleSpeak}>말하기</button>
              <button
                className="btn success"
                onClick={goWritePhase}
                disabled={!ans} // 뭔가 인식은 되었을 때만
              >
                다음 단계(쓰기)
              </button>
            </>
          ) : (
            <>
              {/* 쓰기는 자동 채점이므로 채점 버튼 없음 */}
              <button className="btn success" onClick={goNext}>
                {idx < list.length - 1 ? "다음 문제" : "결과 보기"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
