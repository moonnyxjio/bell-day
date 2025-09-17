import { Routes, Route } from "react-router-dom";
import Start from "./pages/Start";
import Exam from "./pages/Exam";
import Result from "./pages/Result";
import Records from "./pages/Records";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Start />} />
      <Route path="/exam/:day" element={<Exam />} />
      <Route path="/result" element={<Result />} />
      <Route path="/records" element={<Records />} />
    </Routes>
  );
}
