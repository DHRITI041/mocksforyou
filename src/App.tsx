import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateExamPage from './pages/CreateExamPage';
import ExamPage from './pages/ExamPage';
import ExamListPage from './pages/ExamListPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/exams" element={<ExamListPage />} />
        <Route path="/exams/create" element={<CreateExamPage />} />
        <Route path="/exams/:examId/edit" element={<CreateExamPage />} />
        <Route path="/exams/:examId/take" element={<ExamPage />} />
      </Routes>
    </BrowserRouter>
  );
}
