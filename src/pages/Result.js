// src/pages/Result.js
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Result() {
  const nav = useNavigate();
  const { state } = useLocation();
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const recs = JSON.parse(localStorage.getItem("records") || "[]");
    setRecords(recs.filter(r => r.day === state.day));
  }, [state.day]);

  const totalScore = records.reduce((s, r) => s + r.score, 0);
  const totalChunks = records.reduce((s, r) => s + r.totalChunks, 0);

  return (
    <div className="container">
      <div className="card">
        <h1>결과</h1>
        <p>
          {state?.name} | {state?.date} | DAY{state?.day}
        </p>
        <p>
          점수: {totalScore}/{totalChunks} (
          {Math.round((totalScore / totalChunks) * 100)}%)
        </p>

        <div className="nav">
          <button className="btn" onClick={() => setFilter("all")}>전체 보기</button>
          <button className="btn primary" onClick={() => setFilter("wrong")}>오답만 보기</button>
          <button className="btn" onClick={() => nav("/")}>처음으로</button>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {records
          .filter(r => filter === "all" || r.wrongIdxs.length > 0)
          .map((rec, i) => (
            <div key={i} className="card">
              <p>
                {i + 1}. {rec.koChunks.join(" / ")}{" "}
                ({rec.score}/{rec.totalChunks})
              </p>
              <p>
                정답 문장:{" "}
                {rec.enChunks.map((chunk, j) => (
                  <span
                    key={j}
                    style={{
                      color: rec.wrongIdxs.includes(j) ? "red" : "lightgreen",
                    }}
                  >
                    {chunk + " "}
                  </span>
                ))}
              </p>
              <p>학생 답안: {rec.user}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
