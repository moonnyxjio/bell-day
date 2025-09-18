// src/pages/Start.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_PIN = "jchi";
const isAdminSession = () => sessionStorage.getItem("admin_ok") === "1";
const setAdminSession = (ok) => {
  if (ok) sessionStorage.setItem("admin_ok", "1");
  else sessionStorage.removeItem("admin_ok");
};

export default function Start() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [admin, setAdmin] = useState(isAdminSession());

  useEffect(() => setAdmin(isAdminSession()), []);

  const goExam = (day) => {
    if (!name.trim()) {
      alert("학생 이름을 입력해 주세요.");
      return;
    }
    nav(`/exam/${day}`, { state: { name, date, day } });
  };

  const loginAdmin = () => {
    const pin = window.prompt("관리자 PIN을 입력하세요:");
    if (pin === ADMIN_PIN) {
      setAdminSession(true);
      setAdmin(true);
      alert("관리자 모드로 전환되었습니다.");
    } else if (pin !== null) {
      alert("PIN이 올바르지 않습니다.");
    }
  };

  const logoutAdmin = () => {
    setAdminSession(false);
    setAdmin(false);
    alert("관리자 모드가 해제되었습니다.");
  };

  return (
    <div className="container">
      <div className="card" style={{ width: "100%", maxWidth: 640 }}>
        <h1 className="title">A naughty spell for naughty boys</h1>
        <p className="subtitle">말하기 시험 · 오답 재시험 · 뱃지</p>

        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <input
            type="text"
            placeholder="학생 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid #2e2e2e",
              background: "transparent",
              color: "#fff",
            }}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid #2e2e2e",
              background: "transparent",
              color: "#fff",
            }}
          />
        </div>

        <div className="nav" style={{ marginTop: 16, flexWrap: "wrap", gap: 8 }}>
          <button className="btn primary" onClick={() => goExam("day1")}>Day 1 시작</button>
          <button className="btn primary" onClick={() => goExam("day2")}>Day 2 시작</button>
          <button className="btn primary" onClick={() => goExam("day3")}>Day 3 시작</button>
          <button className="btn primary" onClick={() => goExam("day4")}>Day 4 시작</button>
        </div>

        <div className="nav" style={{ marginTop: 8, flexWrap: "wrap", gap: 8 }}>
          <button className="btn" onClick={() => nav("/records")}>기록 보기</button>
          <button className="btn" onClick={() => nav("/badges")}>뱃지 보관함</button>
        </div>

        {/* 관리자 영역: 학생이 실수로 못 누르게 작게 배치 */}
        <div style={{ marginTop: 12, textAlign: "right", opacity: 0.8 }}>
          {!admin ? (
            <button className="btn" style={{ padding: "6px 10px" }} onClick={loginAdmin}>
              관리자 로그인
            </button>
          ) : (
            <button className="btn" style={{ padding: "6px 10px" }} onClick={logoutAdmin}>
              관리자 로그아웃
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
