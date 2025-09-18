// src/pages/Exam.js
import React, { useMemo, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { QUESTIONS } from "../data";

// ----- 유틸 -----
const norm = (s) =>
  s.toLowerCase().replace(/[.,!?;:"'()]/g, "").replace(/\s+/g, " ").trim();
const tokenize = (s) => norm(s).split(" ").filter(Boolean);

// 통과(마스터) 저장소
const MASTER_KEY = "mastery_v1";
const loadMastery = () => {
  try { return JSON.parse(localStorage.getItem(MASTER_KEY) || "{}"); }
  catch { return {}; }
};
const saveMastery = (obj) => localStorage.setItem(MASTER_KEY, JSON.stringify(obj));
const addMastery = (name, day, qid) => {
  const db = loadMastery();
  const keyName = name || "_anon";
  const keyDay = day || "_day";
  db[keyName] = db[keyName] || {};
  db[keyName][keyDay] = db[keyName][keyDay] || [];
  if (!db[keyName][keyDay].includes(qid)) db[keyName][keyDay].push(qid);
  saveMastery(db);
};

export default function Exam() {
  const nav = useNavigate();
  const { day } = useParams(); // URL의 day (ex: day1)
  const { state } = useLocation(); // { name, date, day, retry? }
  const [idx, setIdx] = useState(0);
  const [recognized, setRecognized] = useState("");
  const [feedback, setFeedback] = useState(null);

  // 틀린 것만 다시 / 일반 Day 문제
  const list = useMemo(() => {
    if (state?.retry && Array.isArray(state.retry) && state.retry.length) return state.retry;
    return QUESTIONS[day] || [];
  }, [day, state]);

  const q = list[idx];

  if (!q) {
    return (
      <div className="container">
        <div className="card">
          <h2>문제가 없어요</h2>
          <div className="nav"><button className="btn" onClick={()=>nav("/")}>처음으로</button></div>
        </div>
      </div>
    );
  }

  // 말하기 인식
  const handleSpeak = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("이 브라우저는 음성 인식을 지원하지 않아요. (Chrome 권장)"); return; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript || "";
      setRecognized(text);
      grade(text);
    };
    rec.start();
  };

  // 채점
  const grade = (ans) => {
    const userTokens = tokenize(ans);
    const expectedTokens = tokenize(q.enChunks.join(" "));
    const wrongIdxs = [];
    expectedTokens.forEach((exp, i) => {
      const user = userTokens[i] || "";
      if (user === exp) return;
      if (user + "s" === exp || user === exp + "s") return; // 단순 복수 허용
      wrongIdxs.push(i);
    });
    const score = expectedTokens.length - wrongIdxs.length;

    // 기록 저장 (분석용 로그)
    const rec = {
      name: state?.name || "",
      date: state?.date || new Date().toISOString().slice(0, 10),
      day: state?.day || day,  // retry로 왔을 수도 있으니 state.day 우선
      qid: q.id,
      koChunks: q.koChunks,
      enChunks: expectedTokens,
      full: q.full,
      user: ans,
      wrongIdxs,
      totalChunks: expectedTokens.length,
      score,
      ts: Date.now(),
    };
    const prev = JSON.parse(localStorage.getItem("records") || "[]");
    localStorage.setItem("records", JSON.stringify([...prev, rec]));

    // 오답 0 = 통과 처리
    if (wrongIdxs.length === 0) {
      const student = state?.name || "";
      const theDay = state?.day || day;
      addMastery(student, theDay, q.id);
    }

    setFeedback(rec);

    // 잠깐 보여주고 다음
    setTimeout(() => {
      if (idx < list.length - 1) {
        setRecognized("");
        setFeedback(null);
        setIdx(idx + 1);
      } else {
        nav("/result", { state: { name: state?.name || "", day: state?.day || day } });
      }
    }, 2000);
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">문제 {idx + 1} / {list.length}</h1>
        <p className="yellow">{q.koChunks.join(" / ")}</p>

        <div className="nav" style={{ marginTop: 8 }}>
          <button className="btn primary" onClick={handleSpeak}>말하기</button>
          <button className="btn" onClick={()=>nav("/")}>처음으로</button>
        </div>

        {recognized && (
          <div style={{ marginTop: 12 }}>
            <div className="muted">인식된 문장</div>
            <div style={{ border: "1px solid #333", borderRadius: 8, padding: "8px 10px", marginTop: 4 }}>
              {recognized}
            </div>
          </div>
        )}

        {feedback && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="muted" style={{ marginBottom: 6 }}>정답 비교</div>
            <div>
              {feedback.enChunks.map((tok, i) =>
                feedback.wrongIdxs.includes(i) ? (
                  <span key={i} className="word-bad" style={{ marginRight: 6 }}>{tok}</span>
                ) : (
                  <span key={i} className="word-ok" style={{ marginRight: 6 }}>{tok}</span>
                )
              )}
            </div>
            <div className="muted" style={{ marginTop: 6 }}>
              점수: {feedback.score} / {feedback.totalChunks}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
