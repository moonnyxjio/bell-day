import { useNavigate } from "react-router-dom";

export default function Records() {
  const nav = useNavigate();
  let list = [];
  try { list = JSON.parse(localStorage.getItem("bellcat:sessions") || "[]").reverse(); } catch {}

  const clearAll = () => {
    if (window.confirm("모든 기록을 삭제할까요?")) {
      localStorage.removeItem("bellcat:sessions");
      window.location.reload();
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>저장된 기록</h2>
        <div className="nav">
          <button className="btn" onClick={()=>nav("/")}>처음으로</button>
          <button className="btn danger" onClick={clearAll}>전체 삭제</button>
        </div>
        <table className="list">
          <thead><tr><th>학생</th><th>날짜</th><th>Day</th><th>저장 시각</th><th>점수</th></tr></thead>
          <tbody>
            {list.map((s,i)=>{
              const totals = s.answers.reduce((acc,a)=>{acc.total+=a.score.total; acc.ok+=a.score.ok; return acc;},{ok:0,total:0});
              const pct = Math.round((totals.ok / Math.max(1, totals.total))*100);
              return (
                <tr key={i}>
                  <td>{s.name}</td>
                  <td>{s.date}</td>
                  <td>{s.day.toUpperCase()}</td>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  <td>{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length===0 && <p className="muted">기록이 없습니다.</p>}
      </div>
    </div>
  );
}
