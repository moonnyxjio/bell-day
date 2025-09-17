import { norm } from "../data";

export function DiffText({ user, answer }) {
  const u = norm(user).split(" ").filter(Boolean);
  const a = norm(answer).split(" ").filter(Boolean);
  return (
    <span>
      {a.map((w, i) => (
        <span key={i} className={u[i] === w ? "word-ok" : "word-bad"}>
          {w + " "}
        </span>
      ))}
    </span>
  );
}

export function scoreWords(user, answer) {
  const u = norm(user).split(" ").filter(Boolean);
  const a = norm(answer).split(" ").filter(Boolean);
  let ok = 0;
  a.forEach((w, i) => { if (u[i] === w) ok++; });
  const total = a.length || 1;
  return { ok, total, pct: Math.round(ok / total * 100) };
}
