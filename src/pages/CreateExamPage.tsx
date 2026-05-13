import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Plus, Trash2, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Loader as Loader2, ChevronDown, ChevronUp, Minus, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import styles from './CreateExamPage.module.css';

interface QuestionDraft {
  id?: string;
  text: string;
  options: [string, string, string, string];
  correct_option: number;
  order_index: number;
}

interface ExamSettings {
  title: string;
  description: string;
  duration_minutes: number;
  marks_per_question: number;
  negative_marking_enabled: boolean;
  negative_marking_value: number;
}

const defaultSettings: ExamSettings = {
  title: '',
  description: '',
  duration_minutes: 60,
  marks_per_question: 1,
  negative_marking_enabled: false,
  negative_marking_value: 0.25,
};

const emptyQuestion = (idx: number): QuestionDraft => ({
  text: '',
  options: ['', '', '', ''],
  correct_option: 0,
  order_index: idx,
});

export default function CreateExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(examId);

  const [settings, setSettings] = useState<ExamSettings>(defaultSettings);
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion(0)]);
  const [saving, setSaving] = useState(false);
  const [loadingExam, setLoadingExam] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number>(0);

  const loadExam = useCallback(async () => {
    if (!examId) return;
    const [examRes, qRes] = await Promise.all([
      supabase.from('exams').select('*').eq('id', examId).maybeSingle(),
      supabase.from('questions').select('*').eq('exam_id', examId).order('order_index'),
    ]);

    if (examRes.error || !examRes.data) {
      setError('Exam not found');
      setLoadingExam(false);
      return;
    }

    const e = examRes.data;
    setSettings({
      title: e.title,
      description: e.description ?? '',
      duration_minutes: e.duration_minutes,
      marks_per_question: Number(e.marks_per_question),
      negative_marking_enabled: e.negative_marking_enabled,
      negative_marking_value: Number(e.negative_marking_value),
    });

    if (qRes.data && qRes.data.length > 0) {
      setQuestions(
        qRes.data.map((q) => ({
          id: q.id,
          text: q.text,
          options: q.options as [string, string, string, string],
          correct_option: q.correct_option,
          order_index: q.order_index,
        }))
      );
    }
    setLoadingExam(false);
  }, [examId]);

  useEffect(() => {
    if (isEdit) loadExam();
  }, [isEdit, loadExam]);

  function updateSetting<K extends keyof ExamSettings>(key: K, value: ExamSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function updateQuestion(idx: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options] as [string, string, string, string];
        opts[optIdx] = value;
        return { ...q, options: opts };
      })
    );
  }

  function addQuestion() {
    const idx = questions.length;
    setQuestions((prev) => [...prev, emptyQuestion(idx)]);
    setExpandedQ(idx);
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => {
      const next = prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order_index: i }));
      return next.length === 0 ? [emptyQuestion(0)] : next;
    });
    setExpandedQ(Math.max(0, idx - 1));
  }

  async function handleSave() {
    setError(null);
    if (!settings.title.trim()) {
      setError('Exam title is required.');
      return;
    }
    const invalid = questions.findIndex(
      (q) => !q.text.trim() || q.options.some((o) => !o.trim())
    );
    if (invalid !== -1) {
      setError(`Question ${invalid + 1} is incomplete. Fill in the question and all 4 options.`);
      setExpandedQ(invalid);
      return;
    }

    setSaving(true);

    const examPayload = {
      title: settings.title.trim(),
      description: settings.description.trim() || null,
      duration_minutes: settings.duration_minutes,
      marks_per_question: settings.marks_per_question,
      negative_marking_enabled: settings.negative_marking_enabled,
      negative_marking_value: settings.negative_marking_value,
      updated_at: new Date().toISOString(),
    };

    let targetId = examId;

    if (isEdit && examId) {
      const { error: updateErr } = await supabase
        .from('exams')
        .update(examPayload)
        .eq('id', examId);
      if (updateErr) {
        setError(updateErr.message);
        setSaving(false);
        return;
      }
      await supabase.from('questions').delete().eq('exam_id', examId);
    } else {
      const { data, error: insertErr } = await supabase
        .from('exams')
        .insert(examPayload)
        .select('id')
        .single();
      if (insertErr || !data) {
        setError(insertErr?.message ?? 'Failed to create exam');
        setSaving(false);
        return;
      }
      targetId = data.id;
    }

    const qPayload = questions.map((q, i) => ({
      exam_id: targetId!,
      text: q.text.trim(),
      options: q.options,
      correct_option: q.correct_option,
      order_index: i,
    }));

    const { error: qErr } = await supabase.from('questions').insert(qPayload);
    if (qErr) {
      setError(qErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(true);
    setTimeout(() => navigate('/exams'), 1200);
  }

  if (loadingExam) {
    return (
      <Layout>
        <div className={styles.loading}>
          <Loader2 size={32} className={styles.spin} />
          <span>Loading exam...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.root}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{isEdit ? 'Edit Exam' : 'Create New Exam'}</h1>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className={styles.successBanner}>
            <CheckCircle2 size={18} />
            Exam saved! Redirecting...
          </div>
        )}

        <div className={styles.layout}>
          {/* Settings Panel */}
          <aside className={styles.sidebar}>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Exam Settings</h2>

              <div className={styles.field}>
                <label className={styles.label}>Exam Title <span className={styles.req}>*</span></label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. Physics Mock Test 1"
                  value={settings.title}
                  onChange={(e) => updateSetting('title', e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Optional description for students"
                  value={settings.description}
                  onChange={(e) => updateSetting('description', e.target.value)}
                />
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label}>Duration (minutes)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min={5}
                    max={300}
                    value={settings.duration_minutes}
                    onChange={(e) => updateSetting('duration_minutes', Number(e.target.value))}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Marks per Question</label>
                  <input
                    className={styles.input}
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={settings.marks_per_question}
                    onChange={(e) => updateSetting('marks_per_question', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Negative Marking Section */}
              <div className={styles.negSection}>
                <div className={styles.negHeader}>
                  <div className={styles.negTitleRow}>
                    <Minus size={16} />
                    <span className={styles.negTitle}>Negative Marking</span>
                  </div>
                  <button
                    type="button"
                    className={`${styles.toggle} ${settings.negative_marking_enabled ? styles.toggleActive : ''}`}
                    onClick={() => updateSetting('negative_marking_enabled', !settings.negative_marking_enabled)}
                    aria-label="Toggle negative marking"
                  >
                    <span className={styles.toggleThumb} />
                    <span className={styles.toggleLabel}>
                      {settings.negative_marking_enabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>

                <p className={styles.negDesc}>
                  Deducts marks for wrong answers to discourage random guessing.
                </p>

                {settings.negative_marking_enabled && (
                  <div className={styles.negConfig}>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        Marks deducted per wrong answer
                        <span className={styles.infoTip}>
                          <Info size={13} />
                          <span className={styles.tooltip}>
                            e.g. 0.25 means 1/4 mark deducted for each wrong answer
                          </span>
                        </span>
                      </label>
                      <div className={styles.negInputRow}>
                        <span className={styles.negMinus}>−</span>
                        <input
                          className={`${styles.input} ${styles.negInput}`}
                          type="number"
                          min={0.1}
                          max={settings.marks_per_question}
                          step={0.25}
                          value={settings.negative_marking_value}
                          onChange={(e) => updateSetting('negative_marking_value', Number(e.target.value))}
                        />
                        <div className={styles.presets}>
                          {[0.25, 0.33, 0.5, 1].map((v) => (
                            <button
                              key={v}
                              type="button"
                              className={`${styles.presetBtn} ${settings.negative_marking_value === v ? styles.presetBtnActive : ''}`}
                              onClick={() => updateSetting('negative_marking_value', v)}
                            >
                              {v === 0.33 ? '1/3' : v === 0.25 ? '1/4' : v === 0.5 ? '1/2' : '1'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={styles.negPreview}>
                      <span>Correct: <strong className={styles.green}>+{settings.marks_per_question}</strong></span>
                      <span>Wrong: <strong className={styles.red}>−{settings.negative_marking_value}</strong></span>
                      <span>Skipped: <strong>0</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving || success}
            >
              {saving ? (
                <><Loader2 size={16} className={styles.spin} /> Saving...</>
              ) : success ? (
                <><CheckCircle2 size={16} /> Saved!</>
              ) : (
                <><Save size={16} /> {isEdit ? 'Save Changes' : 'Create Exam'}</>
              )}
            </button>
          </aside>

          {/* Questions Panel */}
          <section className={styles.questionsPanel}>
            <div className={styles.questionsHeader}>
              <h2 className={styles.sectionTitle}>Questions ({questions.length})</h2>
              <button type="button" className={styles.addQBtn} onClick={addQuestion}>
                <Plus size={15} />
                Add Question
              </button>
            </div>

            <div className={styles.questionsList}>
              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className={`${styles.questionCard} ${expandedQ === qIdx ? styles.questionCardOpen : ''}`}
                >
                  <button
                    type="button"
                    className={styles.questionToggle}
                    onClick={() => setExpandedQ(expandedQ === qIdx ? -1 : qIdx)}
                  >
                    <span className={styles.qNum}>Q{qIdx + 1}</span>
                    <span className={styles.qPreview}>
                      {q.text.trim() ? q.text.slice(0, 60) + (q.text.length > 60 ? '…' : '') : 'Untitled question'}
                    </span>
                    <div className={styles.qActions}>
                      <button
                        type="button"
                        className={styles.deleteQBtn}
                        onClick={(e) => { e.stopPropagation(); removeQuestion(qIdx); }}
                        title="Delete question"
                      >
                        <Trash2 size={14} />
                      </button>
                      {expandedQ === qIdx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {expandedQ === qIdx && (
                    <div className={styles.questionBody}>
                      <div className={styles.field}>
                        <label className={styles.label}>Question Text <span className={styles.req}>*</span></label>
                        <textarea
                          className={styles.textarea}
                          rows={3}
                          placeholder="Enter your question here..."
                          value={q.text}
                          onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
                        />
                      </div>

                      <div className={styles.optionsGrid}>
                        <p className={styles.label}>Options — select the correct answer</p>
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`${styles.optionRow} ${q.correct_option === optIdx ? styles.optionRowCorrect : ''}`}
                          >
                            <button
                              type="button"
                              className={`${styles.optionRadio} ${q.correct_option === optIdx ? styles.optionRadioSelected : ''}`}
                              onClick={() => updateQuestion(qIdx, { correct_option: optIdx })}
                              title={`Mark option ${optIdx + 1} as correct`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </button>
                            <input
                              className={`${styles.input} ${styles.optionInput}`}
                              type="text"
                              placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                              value={opt}
                              onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className={styles.addQBtnBottom} onClick={addQuestion}>
              <Plus size={16} />
              Add Another Question
            </button>
          </section>
        </div>
      </div>
    </Layout>
  );
}
