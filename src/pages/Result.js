import { useLocation, useNavigate } from "react-router-dom";

export default function Result() {
  const { state } = useLocation();
  const nav = useNavigate();
  const session = state?.session;

  if (!session) {
    return (
      <div className="container">
        <div className="card">
          <h1 className="title">결과 없음</h1>
          <p className="subtitle">세션 정보가 없습니다.</p>
          <button className="btn" onClick={()=>nav("/")}>처음으로</button>
        </div>
      </div>
    );
  }

  const totals = session.answers.reduce((acc, a)=>{
    acc.total += a.score.total;
    acc.ok += a.score.ok;
    return acc;
  }, { ok:0, total:0 });
  const pct = Math.round((totals.ok / Math.max(1, totals.total)) * 100);

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">시험 결과</h1>
        <p className="subtitle">
          {session.name} · {session.date} · {session.day.toUpperCase()}
        </p>

        <div className="yellow" style={{fontWeight:700}}>
          총점: {totals.ok}/{totals.total} ({pct}%)
        </div>

        <table className="list" style={{marginTop:12}}>
          <thead>
            <tr>
              <th>#</th>
              <th>단계</th>
              <th>한국어</th>
              <th>학생 답</th>
              <th>정답</th>
              <th>점수</th>
            </tr>
          </thead>
          <tbody>
            {session.answers.map((a,i)=>(
              <tr key={i}>
                <td>{a.idx+1}</td>
                <td>{a.phase==="speak"?"말하기":"쓰기"}</td>
                <td>{a.kor}</td>
                <td>{a.user}</td>
                <td>{a.answer}</td>
                <td>{a.score.ok}/{a.score.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="nav">
          <button className="btn" onClick={()=>nav("/")}>처음으로</button>
          <button className="btn" onClick={()=>nav("/records")}>기록 보기</button>
        </div>
      </div>
    </div>
  );
}
