// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Start from "./pages/Start";
import Exam from "./pages/Exam";
import Result from "./pages/Result";
import Records from "./pages/Records";
import Badges from "./pages/Badges";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Start />} />
      <Route path="/exam/:day" element={<Exam />} />
      <Route path="/result" element={<Result />} />
      <Route path="/records" element={<Records />} />
      <Route path="/badges" element={<Badges />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
