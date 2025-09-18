// src/pages/Exam.js
import React, { useMemo, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { QUESTIONS } from "../data";

// 정규화 함수 (소문자, 불필요한 기호 제거)
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

  // 🎤 음성 인식 (Web Speech API)
  const handleSpeak = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("이 브라우저에서는 음성 인식을 지원하지 않아요.");
      return;
    }
    const recog = new window.webkitSpeechRecognition();
    recog.lang = "en-US";
    recog.onresult = (e) => {
      setAns(e.results[0][0].transcript);
    };
    recog.start();
  };

  // 채점
  const handleCheck = () => {
    const userTokens = tokenize(ans);
    const expectedTokens = tokenize(q.enChunks.join(" "));

    const wrongIdxs = [];
    expectedTokens.forEach((exp, i) => {
      const user = userTokens[i] || "";
      if (user === exp) return; // 정확히 같음
      if (user + "s" === exp || user === exp + "s") return; // 복수형 허용
      wrongIdxs.push(i); // 오답
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

    if (idx < list.length - 1) {
      setAns("");
      setIdx(idx + 1);
    } else {
      nav("/result", { state: { name: rec.name, date: rec.date, day } });
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">문제 {idx + 1} / {list.length}</h1>
        <p className="yellow">{q.koChunks.join(" / ")}</p>
        <textarea
          placeholder="영어로 문장을 쓰세요"
          value={ans}
          onChange={(e) => setAns(e.target.value)}
          rows={3}
        />
        <div className="nav">
          <button className="btn" onClick={handleSpeak}>말하기</button>
          <button className="btn primary" onClick={handleCheck}>채점하기</button>
          <button className="btn" onClick={() => setAns(q.full)}>정답 넣기</button>
        </div>
      </div>
    </div>
  );
}
