import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, TriangleAlert as AlertTriangle, ChevronLeft, ChevronRight, Send, Loader as Loader2, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import styles from './ExamPage.module.css';

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  negative_marking_enabled: boolean;
  negative_marking_value: number;
  marks_per_question: number;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correct_option: number;
  order_index: number;
}

type Phase = 'lobby' | 'exam' | 'submitting';

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('lobby');
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [nameError, setNameError] = useState('');

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const submitExam = useCallback(async (forcedAnswers?: Record<string, number>) => {
    if (!exam || !questions.length) return;
    setPhase('submitting');
    if (timerRef.current) clearInterval(timerRef.current);

    const finalAnswers = forcedAnswers ?? answers;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    for (const q of questions) {
      const ans = finalAnswers[q.id];
      if (ans === undefined || ans === -1) {
        skipped++;
      } else if (ans === q.correct_option) {
        correct++;
      } else {
        wrong++;
      }
    }

    const positiveMarks = correct * exam.marks_per_question;
    const negativeDeduction = exam.negative_marking_enabled
      ? wrong * exam.negative_marking_value
      : 0;
    const score = Math.max(0, positiveMarks - negativeDeduction);
    const totalMarks = questions.length * exam.marks_per_question;

    const { data, error: submitErr } = await supabase
      .from('exam_attempts')
      .insert({
        exam_id: exam.id,
        student_name: studentName.trim(),
        answers: finalAnswers,
        score,
        total_marks: totalMarks,
        correct_count: correct,
        wrong_count: wrong,
        skipped_count: skipped,
        negative_marks_deducted: negativeDeduction,
        time_taken_seconds: timeTaken,
      })
      .select('id')
      .single();

    if (submitErr || !data) {
      setError(submitErr?.message ?? 'Failed to submit exam');
      setPhase('exam');
      return;
    }

    navigate(`/attempts/${data.id}/result`);
  }, [exam, questions, answers, startTime, studentName, navigate]);

  useEffect(() => {
    async function load() {
      const [examRes, qRes] = await Promise.all([
        supabase.from('exams').select('*').eq('id', examId).maybeSingle(),
        supabase.from('questions').select('*').eq('exam_id', examId).order('order_index'),
      ]);

      if (examRes.error || !examRes.data) {
        setError('Exam not found.');
        setLoading(false);
        return;
      }

      setExam(examRes.data as Exam);
      setQuestions((qRes.data ?? []) as Question[]);
      setLoading(false);
    }
    load();
  }, [examId]);

  useEffect(() => {
    if (phase !== 'exam') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, submitExam]);

  function startExam() {
    if (!studentName.trim()) {
      setNameError('Please enter your name to continue.');
      return;
    }
    setNameError('');
    setTimeLeft((exam?.duration_minutes ?? 60) * 60);
    setStartTime(Date.now());
    setPhase('exam');
  }

  function selectAnswer(questionId: string, optionIdx: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  }

  function clearAnswer(questionId: string) {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const answeredCount = Object.keys(answers).length;
  const isLowTime = timeLeft < 300 && timeLeft > 0;

  if (loading) {
    return (
      <div className={styles.fullCenter}>
        <Loader2 size={32} className={styles.spin} />
        <span>Loading exam...</span>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className={styles.fullCenter}>
        <AlertTriangle size={32} className={styles.errorIcon} />
        <p>{error ?? 'Exam not found'}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={styles.fullCenter}>
        <AlertTriangle size={32} className={styles.errorIcon} />
        <p>This exam has no questions yet.</p>
      </div>
    );
  }

  /* LOBBY */
  if (phase === 'lobby') {
    return (
      <div className={styles.lobbyRoot}>
        <div className={styles.lobbyCard}>
          <div className={styles.lobbyHeader}>
            <div className={styles.examBadge}>{questions.length} Questions</div>
            <h1 className={styles.lobbyTitle}>{exam.title}</h1>
            {exam.description && <p className={styles.lobbyDesc}>{exam.description}</p>}
          </div>

          <div className={styles.lobbyMeta}>
            <div className={styles.metaItem}>
              <Clock size={18} className={styles.metaIcon} />
              <div>
                <div className={styles.metaVal}>{exam.duration_minutes} minutes</div>
                <div className={styles.metaKey}>Duration</div>
              </div>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaIconMark}>+{exam.marks_per_question}</span>
              <div>
                <div className={styles.metaVal}>{exam.marks_per_question} mark{exam.marks_per_question !== 1 ? 's' : ''}</div>
                <div className={styles.metaKey}>Per correct answer</div>
              </div>
            </div>
            <div className={`${styles.metaItem} ${exam.negative_marking_enabled ? styles.metaItemNeg : ''}`}>
              <Minus size={18} className={`${styles.metaIcon} ${exam.negative_marking_enabled ? styles.metaIconNeg : ''}`} />
              <div>
                {exam.negative_marking_enabled ? (
                  <>
                    <div className={`${styles.metaVal} ${styles.metaValNeg}`}>−{exam.negative_marking_value} per wrong</div>
                    <div className={styles.metaKey}>Negative marking enabled</div>
                  </>
                ) : (
                  <>
                    <div className={styles.metaVal}>No penalty</div>
                    <div className={styles.metaKey}>No negative marking</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {exam.negative_marking_enabled && (
            <div className={styles.negWarning}>
              <AlertTriangle size={16} />
              <p>
                <strong>Negative marking is active.</strong> Each wrong answer will deduct{' '}
                <strong>{exam.negative_marking_value}</strong> mark{exam.negative_marking_value !== 1 ? 's' : ''}.
                Skipped questions carry no penalty.
              </p>
            </div>
          )}

          <div className={styles.nameSection}>
            <label className={styles.nameLabel}>Your Name</label>
            <input
              className={`${styles.nameInput} ${nameError ? styles.nameInputError : ''}`}
              type="text"
              placeholder="Enter your full name"
              value={studentName}
              onChange={(e) => { setStudentName(e.target.value); setNameError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && startExam()}
            />
            {nameError && <p className={styles.nameErrorMsg}>{nameError}</p>}
          </div>

          <button className={styles.startBtn} onClick={startExam}>
            Start Exam
          </button>

          <p className={styles.startNote}>
            Once started, the timer cannot be paused. Make sure you are ready.
          </p>
        </div>
      </div>
    );
  }

  /* SUBMITTING */
  if (phase === 'submitting') {
    return (
      <div className={styles.fullCenter}>
        <Loader2 size={32} className={styles.spin} />
        <span>Submitting your answers...</span>
      </div>
    );
  }

  /* EXAM */
  const q = questions[currentQ];
  const selectedAns = answers[q.id];

  return (
    <div className={styles.examRoot}>
      {/* Header bar */}
      <div className={styles.examHeader}>
        <div className={styles.examHeaderInner}>
          <div className={styles.examTitle}>{exam.title}</div>
          <div className={`${styles.timer} ${isLowTime ? styles.timerLow : ''}`}>
            <Clock size={15} />
            {formatTime(timeLeft)}
          </div>
          <div className={styles.progress}>
            {answeredCount}/{questions.length} answered
          </div>
        </div>
      </div>

      <div className={styles.examBody}>
        {/* Question nav sidebar */}
        <aside className={styles.questionNav}>
          <p className={styles.navTitle}>Questions</p>
          <div className={styles.navGrid}>
            {questions.map((qs, idx) => {
              const isAns = answers[qs.id] !== undefined;
              const isCur = idx === currentQ;
              return (
                <button
                  key={qs.id}
                  className={`${styles.navBtn} ${isCur ? styles.navBtnCurrent : ''} ${isAns && !isCur ? styles.navBtnAnswered : ''}`}
                  onClick={() => setCurrentQ(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className={styles.navLegend}>
            <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.dotAnswered}`} /> Answered</span>
            <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.dotCurrent}`} /> Current</span>
            <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.dotUnanswered}`} /> Unanswered</span>
          </div>
          {exam.negative_marking_enabled && (
            <div className={styles.navNegNote}>
              <Minus size={12} />
              Negative marking active
            </div>
          )}
          <button className={styles.submitSideBtn} onClick={() => submitExam()}>
            <Send size={14} />
            Submit Exam
          </button>
        </aside>

        {/* Main question area */}
        <main className={styles.questionMain}>
          <div className={styles.questionCard}>
            <div className={styles.questionNum}>
              Question {currentQ + 1} <span>of {questions.length}</span>
            </div>
            <p className={styles.questionText}>{q.text}</p>

            <div className={styles.options}>
              {q.options.map((opt, optIdx) => {
                const isSelected = selectedAns === optIdx;
                return (
                  <button
                    key={optIdx}
                    className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
                    onClick={() => selectAnswer(q.id, optIdx)}
                  >
                    <span className={`${styles.optionLetter} ${isSelected ? styles.optionLetterSelected : ''}`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className={styles.optionText}>{opt}</span>
                  </button>
                );
              })}
            </div>

            {selectedAns !== undefined && (
              <button className={styles.clearBtn} onClick={() => clearAnswer(q.id)}>
                Clear selection
              </button>
            )}
          </div>

          <div className={styles.questionFooter}>
            <button
              className={styles.navPrevBtn}
              onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
              disabled={currentQ === 0}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {currentQ === questions.length - 1 ? (
              <button className={styles.submitBtn} onClick={() => submitExam()}>
                <Send size={16} />
                Submit Exam
              </button>
            ) : (
              <button
                className={styles.navNextBtn}
                onClick={() => setCurrentQ((p) => Math.min(questions.length - 1, p + 1))}
              >
                Next
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
