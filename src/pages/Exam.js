// src/pages/Exam.js
import React, { useEffect, useMemo, useState } from "react";
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
  const [ans, setAns] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);

  const list = useMemo(() => QUESTIONS[day] || [], [day]);
  const q = list[idx];

  // 🎤 브라우저에서 음성인식 가능한지 확인
  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      setSpeechSupported(true);
    }
  }, []);

  // 문제 없을 때 처리
  useEffect(() => {
    if (!q) {
      console.log("문제가 없습니다.");
    }
  }, [q]);

  if (!q) {
    return (
      <div className="container">
        <div className="card">
          <h2>문제가 없어요</h2>
        </div>
      </div>
    );
  }

  // 🎤 말하기 시작
  const handleSpeak = () => {
    if (!speechSupported) {
      alert("이 브라우저는 음성 인식을 지원하지 않아요.");
      return;
    }

    const recog = new window.webkitSpeechRecognition();
    recog.lang = "en-US";
    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setAns(transcript);
      handleCheck(transcript); // 말하기 후 자동 채점
    };
    recog.start();
  };

  // 채점 로직
  const handleCheck = (answerText = ans) => {
    const userTokens = tokenize(answerText);
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
      user: answerText,
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
        <h1 className="title">
          문제 {idx + 1} / {list.length}
        </h1>
        <p className="yellow">{q.koChunks.join(" / ")}</p>

        <textarea
          placeholder="영어로 문장을 쓰세요"
          value={ans}
          onChange={(e) => setAns(e.target.value)}
          rows={3}
        />

        <div className="nav">
          {speechSupported && (
            <button className="btn primary" onClick={handleSpeak}>
              말하기
            </button>
          )}
          <button className="btn" onClick={() => handleCheck()}>
            채점하기
          </button>
        </div>
      </div>
    </div>
  );
}
