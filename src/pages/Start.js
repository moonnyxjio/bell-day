import { useNavigate } from "react-router-dom";
import { DAY_LIST } from "../data";
import { useState } from "react";

export default function Start() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [day, setDay] = useState("day1");

  const onStart = () => {
    if (!name) {
      alert("이름을 입력해주세요.");
      return;
    }
    nav(`/exam/${day}`, { state: { name, date, day } });
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Who’s Going to Bell the Cat?</h1>
        <p className="subtitle">Day를 선택하고, 이름과 날짜를 입력하세요.</p>

        <div className="row" style={{ marginBottom: 12 }}>
          <div style={{ flex: "1 1 200px" }}>
            <label className="muted">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
            />
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <label className="muted">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <label className="muted">Day 선택</label>
        <div className="row" style={{ marginTop: 8 }}>
          {DAY_LIST.map((d) => (
            <button
              key={d.key}
              className={`btn ${day === d.key ? "primary" : ""}`}
              onClick={() => setDay(d.key)}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="nav">
          <button className="btn primary" onClick={onStart}>
            시작하기
          </button>
          <button className="btn" onClick={() => nav("/records")}>
            기록 보기
          </button>
        </div>
      </div>
    </div>
  );
}
