// src/pages/Exam.js
import React, { useMemo, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { QUESTIONS } from "../data";

// 정규화 함수
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[.,!?;:"'()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// 단어 토큰화
const tokenize = (s) => norm(s).split(" ").filter(Boolean);

export default function Exam() {
  const nav = useNavigate();
  const { day } = useParams();
  const { state } = useLocation();
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState("");
  const [feedback, setFeedback] = useState(null);

  const list = useMemo(() => QUESTIONS[day] || [], [day]);
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

  // --- 음성 인식 ---
  const handleSpeak = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
      return;
    }
    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.onresult = (e) => {
      const spoken = e.results[0][0].transcript;
      setAns(spoken);
      checkAnswer(spoken);
    };
    recog.start();
  };

  // --- 채점 로직 ---
  const checkAnswer = (spoken) => {
    const userTokens = tokenize(spoken);
    const expectedTokens = tokenize(q.enChunks.join(" "));

    const wrongIdxs = [];
    expectedTokens.forEach((exp, i) => {
      const user = userTokens[i] || "";
      if (user === exp) return;
      if (user + "s" === exp || user === exp + "s") return;
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
      user: spoken,
      wrongIdxs,
      totalChunks: expectedTokens.length,
      score,
      ts: Date.now(),
    };
    const prev = JSON.parse(localStorage.getItem("records") || "[]");
    localStorage.setItem("records", JSON.stringify([...prev, rec]));

    // 피드백 표시 (색상 하이라이트)
    const highlighted = expectedTokens.map((tok, i) =>
      wrongIdxs.includes(i) ? (
        <span key={i} style={{ color: "red" }}>
          {tok + " "}
        </span>
      ) : (
        <span key={i} style={{ color: "lightgreen" }}>
          {tok + " "}
        </span>
      )
    );
    setFeedback(
      <div className="feedback">
        <p>
          정답 문장: <strong>{highlighted}</strong>
        </p>
        <p>학생 답안: {spoken}</p>
        <p>
          점수: {score} / {expectedTokens.length}
        </p>
      </div>
    );

    // 잠깐 보여주고 자동으로 다음 문제
    setTimeout(() => {
      setFeedback(null);
      if (idx < list.length - 1) {
        setAns("");
        setIdx(idx + 1);
      } else {
        nav("/result", { state: { name: rec.name, date: rec.date, day } });
      }
    }, 3000);
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">
          문제 {idx + 1} / {list.length}
        </h1>
        <p className="yellow">{q.koChunks.join(" / ")}</p>
        <div className="nav">
          <button className="btn primary" onClick={handleSpeak}>
            말하기
          </button>
        </div>
        {feedback && <div className="result-box">{feedback}</div>}
      </div>
    </div>
  );
}
