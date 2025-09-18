// src/pages/Exam.js
import React, { useMemo, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { QUESTIONS } from "../data";

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[.,!?;:"'()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (s) => norm(s).split(" ").filter(Boolean);

export default function Exam() {
  const nav = useNavigate();
  const { day } = useParams();
  const { state } = useLocation();
  const [idx, setIdx] = useState(0);
  const [recognized, setRecognized] = useState(""); // 말하기 인식된 결과
  const [feedback, setFeedback] = useState(null);   // 채점 결과

  // retry 모드 (틀린 문제만 다시) 있으면 그걸로, 아니면 일반 Day 문제로
  const list = useMemo(() => {
    if (state?.retry) return state.retry;
    return QUESTIONS[day] || [];
  }, [day, state]);

  const q = list[idx];

  if (!q) {
    return (
      <div className="container">
        <div className="card">
          <h2>문제가 없어요</h2>
        </div>
      </div>
    );
  }

  // 말하기 인식 (간단 버전: 브라우저 SpeechRecognition API)
  const handleSpeak = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setRecognized(text);
      handleCheck(text);
    };
    rec.start();
  };

  // 채점
  const handleCheck = (ans) => {
    const userTokens = tokenize(ans);
    const expectedTokens = tokenize(q.enChunks.join(" "));

    const wrongIdxs = [];
    expectedTokens.forEach((exp, i) => {
      const user = userTokens[i] || "";
      if (user === exp) return;
      if (user + "s" === exp || user === exp + "s") return; // 복수형 허용
      wrongIdxs.push(i);
    });

    const score = expectedTokens.length - wrongIdxs.length;

    const rec = {
      name: state?.name || "",
      date: state?.date || new Date().toISOString().slice(0, 10),
      day,
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

    setFeedback(rec);

    setTimeout(() => {
      if (idx < list.length - 1) {
        setRecognized("");
        setFeedback(null);
        setIdx(idx + 1);
      } else {
        nav("/result", { state: { name: rec.name, date: rec.date, day } });
      }
    }, 2500); // 2.5초 후 자동 다음 문제
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">문제 {idx + 1} / {list.length}</h1>
        <p className="yellow">{q.koChunks.join(" / ")}</p>

        <div className="speech-box">
          <button className="btn primary" onClick={handleSpeak}>말하기</button>
        </div>

        {recognized && (
          <div style={{ marginTop: 20 }}>
            <p>🗣 인식된 문장: {recognized}</p>
          </div>
        )}

        {feedback && (
          <div style={{ marginTop: 20 }}>
            <p>
              정답:{" "}
              {feedback.enChunks.map((tok, i) =>
                feedback.wrongIdxs.includes(i) ? (
                  <span key={i} style={{ color: "red", marginRight: 4 }}>{tok}</span>
                ) : (
                  <span key={i} style={{ color: "green", marginRight: 4 }}>{tok}</span>
                )
              )}
            </p>
            <p>점수: {feedback.score} / {feedback.totalChunks}</p>
          </div>
        )}
      </div>
    </div>
  );
}
