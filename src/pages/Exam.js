// src/pages/Exam.js
import React, { useMemo, useState, useEffect } from "react";
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
  const [isRecording, setIsRecording] = useState(false);

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

  // 🎤 Speech-to-Text
  useEffect(() => {
    let recognition;
    if ("webkitSpeechRecognition" in window) {
      recognition = new window.webkitSpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        setAns(spoken);
        handleCheck(spoken); // 자동 채점
      };

      if (isRecording) recognition.start();
      else recognition.stop();
    }
    return () => recognition && recognition.stop();
  }, [isRecording]);

  const handleCheck = (answer = ans) => {
    const userTokens = tokenize(answer);
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
      mode: "SPEAK",
      day,
      qid: q.id,
      koChunks: q.koChunks,
      enChunks: expectedTokens,
      full: q.full,
      user: answer,
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
        <p className="gray small">영어로 말하기</p>

        <div className="nav">
          <button
            className={`btn ${isRecording ? "danger" : "primary"}`}
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? "⏹ 멈추기" : "🎤 말하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
