import { useLocation, useNavigate, useParams } from "react-router-dom";
import { DAYS, norm } from "../data";
import { useEffect, useMemo, useRef, useState } from "react";

// ----- 유틸: 단어 정규화 -----
const splitWords = (s) => norm(s).split(" ").filter(Boolean);

// ----- 유틸: 정답 문장을 korChunks 비율로 "영어 청크"로 자르기 -----
function chunkAnswerByKor(answer, korChunks) {
  const words = splitWords(answer);
  if (!korChunks?.length) return [words];

  // korChunks 길이(문자 수) 비율로 단어 수 배분
  const lens = korChunks.map(c => (c || "").length || 1);
  const totalLen = lens.reduce((a,b)=>a+b,0);
  const totalWords = words.length;

  // 각 청크에 단어 개수 배정(반올림 누적 보정)
  const alloc = [];
  let used = 0;
  for (let i=0;i<lens.length;i++){
    let n = Math.round(totalWords * (lens[i]/totalLen));
    // 마지막 청크에 남은 단어 몰아주기
    if (i === lens.length-1) n = totalWords - used;
    alloc.push(Math.max(0,n));
    used += n;
  }
  // 자르기
  const chunks = [];
  let idx = 0;
  for (const n of alloc){
    chunks.push(words.slice(idx, idx+n));
    idx += n;
  }
  return chunks;
}

// ----- 유틸: 청크/단어 채점 -----
function scoreByChunks(user, answer, korChunks) {
  const u = splitWords(user);
  const a = splitWords(answer);

  // 위치기반 단어 채점(간단하게 포지션 매칭)
  const wordResults = a.map((w,i)=>({ word:w, ok: u[i] === w }));

  // 청크로 다시 묶기
  const aChunks = chunkAnswerByKor(answer, korChunks);
  const byChunk = [];
  let cursor = 0;
  for (const ch of aChunks){
    const wr = wordResults.slice(cursor, cursor + ch.length);
    const ok = wr.filter(x=>x.ok).length;
    byChunk.push({
      words: wr,
      ok,
      total: ch.length
    });
    cursor += ch.length;
  }

  const totalOk = wordResults.filter(x=>x.ok).length;
  const total = wordResults.length || 1;
  return { byChunk, totalOk, total, pct: Math.round(totalOk/total*100) };
}

export default function Exam() {
  const { state } = useLocation();
  const { day } = useParams();
  const nav = useNavigate();
  const items = DAYS[day] || [];

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("speak"); // speak -> type
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);
  const [recognizing, setRecognizing] = useState(false);

  // 세션 누적
  const sessionRef = useRef({
    name: state?.name || "",
    date: state?.date || "",
    day,
    answers: [] // {idx, kor, answer, user, phase, score}
  });

  useEffect(()=>{
    if (!state?.name) nav("/");
  }, [state, nav]);

  const current = items[idx];
  const answer = current?.eng || "";
  const kor = current?.korChunks || [];

  const result = useMemo(
    ()=> show ? scoreByChunks(input, answer, kor) : null,
    [show, input, answer, kor]
  );

  // 말하기(STT)
  const handleSpeak = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("크롬에서만 말하기가 지원됩니다."); return; }
    const recog = new SR();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onstart = ()=> setRecognizing(true);
    recog.onend = ()=> setRecognizing(false);
    recog.onresult = (e)=>{
      const text = e.results[0][0].transcript;
      setInput(text);
      setShow(true);
    };
    recog.start();
  };

  // 현재 문제 저장
  const saveCurrent = (mode) => {
    sessionRef.current.answers.push({
      idx,
      kor: kor.join(" / "),
      answer,
      user: input,
      phase: mode,
      score: result
        ? { ok: result.totalOk, total: result.total, pct: result.pct }
        : { ok: 0, total: splitWords(answer).length, pct: 0 }
    });
  };

  const toTypePhase = () => {
    if (!show) { alert("먼저 채점하기를 눌러주세요."); return; }
    saveCurrent("speak");
    setPhase("type");
    setInput("");
    setShow(false);
  };

  const nextItem = () => {
    if (!show) { alert("먼저 채점하기를 눌러주세요."); return; }
    saveCurrent("type");
    if (idx + 1 < items.length) {
      setIdx(idx + 1);
      setPhase("speak");
      setInput("");
      setShow(false);
    } else {
      // 세션 저장 후 결과 페이지로 이동
      const all = JSON.parse(localStorage.getItem("bellcat:sessions") || "[]");
      const session = { ...sessionRef.current, createdAt: new Date().toISOString() };
      all.push(session);
      localStorage.setItem("bellcat:sessions", JSON.stringify(all));
      nav("/result", { state: { session } });
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="chip" style={{marginBottom:8}}>문제 {idx+1} / {items.length} · {phase==="speak"?"말하기":"쓰기"}</div>
        <div className="yellow" style={{ marginBottom: 12, fontWeight:600 }}>
          {kor.join(" / ")}
        </div>

        <textarea
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          rows={2}
          placeholder="영어로 입력 (슬래시 없어도 됨)"
        />

        <div className="row" style={{justifyContent:"center", marginTop:10}}>
          {phase === "speak" && (
            <button className="btn purple" onClick={handleSpeak}>
              {recognizing ? "🎤 듣는 중..." : "🎙 말하기"}
            </button>
          )}
          <button className="btn primary" onClick={()=>setShow(true)}>채점하기</button>
          {phase === "speak" ? (
            <button className="btn success" onClick={toTypePhase}>다음 단계(쓰기)</button>
          ) : (
            <button className="btn success" onClick={nextItem}>다음 문제</button>
          )}
        </div>

        {show && result && (
          <div className="result" style={{marginTop:12}}>
            <b>청크 채점</b>
            <div style={{display:"grid", gap:8, marginTop:8}}>
              {result.byChunk.map((ch, i)=>(
                <div key={i} style={{border:"1px solid #eee", borderRadius:8, padding:8}}>
                  <div className="muted" style={{marginBottom:6}}>
                    KOR {i+1}: {kor[i] || "-"}
                  </div>
                  <div>
                    {ch.words.map((w, j)=>(
                      <span key={j} className={w.ok ? "word-ok" : "word-bad"}>
                        {w.word + " "}
                      </span>
                    ))}
                  </div>
                  <div className="muted">{ch.ok}/{ch.total}</div>
                </div>
              ))}
            </div>

            <div style={{marginTop:10, fontWeight:700}}>
              총점: {result.totalOk}/{result.total} ({result.pct}%)
            </div>

            <details style={{marginTop:8}}>
              <summary className="muted">정답 문장 보기</summary>
              <div style={{marginTop:6}}>{answer}</div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
