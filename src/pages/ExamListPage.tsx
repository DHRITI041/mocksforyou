import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CirclePlus as PlusCircle, Clock, FileText, Minus, Play, CreditCard as Edit2, Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import styles from './ExamListPage.module.css';

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  negative_marking_enabled: boolean;
  negative_marking_value: number;
  marks_per_question: number;
  created_at: string;
  question_count?: number;
}

export default function ExamListPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('exams')
        .select('*, questions(count)')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        const mapped = (data || []).map((e: Record<string, unknown>) => ({
          ...e,
          question_count: Array.isArray(e.questions)
            ? (e.questions as Array<{ count: number }>)[0]?.count ?? 0
            : 0,
        })) as Exam[];
        setExams(mapped);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className={styles.loading}>
          <Loader2 size={32} className={styles.spin} />
          <span>Loading exams...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={styles.error}>
          <AlertCircle size={24} />
          <span>{error}</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.root}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>All Exams</h1>
            <p className={styles.subtitle}>{exams.length} exam{exams.length !== 1 ? 's' : ''} available</p>
          </div>
          <Link to="/exams/create" className={styles.createBtn}>
            <PlusCircle size={16} />
            Create Exam
          </Link>
        </div>

        {exams.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={40} />
            <h3>No exams yet</h3>
            <p>Create your first exam to get started.</p>
            <Link to="/exams/create" className={styles.emptyBtn}>
              <PlusCircle size={16} />
              Create Exam
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {exams.map((exam) => (
              <div key={exam.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <h2 className={styles.examTitle}>{exam.title}</h2>
                  {exam.description && (
                    <p className={styles.examDesc}>{exam.description}</p>
                  )}
                </div>
                <div className={styles.meta}>
                  <span className={styles.metaItem}>
                    <Clock size={14} />
                    {exam.duration_minutes} min
                  </span>
                  <span className={styles.metaItem}>
                    <FileText size={14} />
                    {exam.question_count ?? 0} questions
                  </span>
                  {exam.negative_marking_enabled && (
                    <span className={`${styles.metaItem} ${styles.metaNeg}`}>
                      <Minus size={14} />
                      -{exam.negative_marking_value} per wrong
                    </span>
                  )}
                </div>
                <div className={styles.marksRow}>
                  <span className={styles.marksTag}>+{exam.marks_per_question} per correct</span>
                  {exam.negative_marking_enabled ? (
                    <span className={styles.negTag}>Negative marking ON</span>
                  ) : (
                    <span className={styles.noNegTag}>No negative marking</span>
                  )}
                </div>
                <div className={styles.actions}>
                  <Link to={`/exams/${exam.id}/edit`} className={styles.editBtn}>
                    <Edit2 size={14} />
                    Edit
                  </Link>
                  <Link to={`/exams/${exam.id}/take`} className={styles.startBtn}>
                    <Play size={14} />
                    Start Exam
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
