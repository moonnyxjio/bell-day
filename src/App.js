import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Start from "./pages/Start";
import Exam from "./pages/Exam";
import Result from "./pages/Result";
import Records from "./pages/Records";
import "./App.css";

export default function App() {
  return (
    <Routes>
      {/* 시작 화면 */}
      <Route path="/" element={<Start />} />
      {/* 말하기 시험 */}
      <Route path="/exam/:day" element={<Exam />} />
      {/* 결과 화면 */}
      <Route path="/result" element={<Result />} />
      {/* 기록 보기 */}
      <Route path="/records" element={<Records />} />
      {/* 잘못된 경로는 홈으로 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
