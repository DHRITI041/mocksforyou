/*
  # Exam System with Negative Marking

  ## Overview
  Creates the full schema for an exam/quiz system that supports configurable negative marking.

  ## New Tables

  ### `exams`
  Stores exam configuration including negative marking settings.
  - `id` - UUID primary key
  - `title` - Exam name
  - `description` - Optional description
  - `duration_minutes` - Time limit for the exam
  - `negative_marking_enabled` - Toggle for negative marking (can be set before exam starts)
  - `negative_marking_value` - Fraction deducted per wrong answer (e.g., 0.25 = 1/4 mark)
  - `marks_per_question` - Marks awarded per correct answer
  - `created_at`, `updated_at` - Timestamps

  ### `questions`
  Stores MCQ questions for each exam.
  - `id` - UUID primary key
  - `exam_id` - Foreign key to exams
  - `text` - Question text
  - `options` - Array of 4 answer choices
  - `correct_option` - Index (0-3) of the correct answer
  - `order_index` - Display order

  ### `exam_attempts`
  Records each student's attempt at an exam.
  - `id` - UUID primary key
  - `exam_id` - Foreign key to exams
  - `student_name` - Name entered by student
  - `answers` - JSONB map of question_id -> selected option index
  - `score` - Final calculated score (after negative marking)
  - `total_marks` - Max possible marks
  - `correct_count`, `wrong_count`, `skipped_count` - Breakdown
  - `negative_marks_deducted` - Total marks lost to negative marking
  - `time_taken_seconds` - How long the student took
  - `completed_at` - Timestamp

  ## Security
  - RLS enabled on all tables
  - Public read access for exams and questions (no auth required for demo)
  - Public insert for exam_attempts (students submit without auth)
  - No update/delete allowed on attempts (immutable records)
*/

CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text,
  duration_minutes integer NOT NULL DEFAULT 60,
  negative_marking_enabled boolean NOT NULL DEFAULT false,
  negative_marking_value numeric(4,2) NOT NULL DEFAULT 0.25,
  marks_per_question numeric(4,2) NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  text text NOT NULL DEFAULT '',
  options text[] NOT NULL DEFAULT '{}',
  correct_option integer NOT NULL DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_name text NOT NULL DEFAULT '',
  answers jsonb NOT NULL DEFAULT '{}',
  score numeric(8,2) NOT NULL DEFAULT 0,
  total_marks numeric(8,2) NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  wrong_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  negative_marks_deducted numeric(8,2) NOT NULL DEFAULT 0,
  time_taken_seconds integer NOT NULL DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS questions_exam_id_idx ON questions(exam_id);
CREATE INDEX IF NOT EXISTS exam_attempts_exam_id_idx ON exam_attempts(exam_id);

-- Enable RLS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

-- Exams: anyone can read, anyone can create/update (admin panel without auth for demo)
CREATE POLICY "Anyone can view exams"
  ON exams FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create exams"
  ON exams FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update exams"
  ON exams FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Questions: anyone can read, create, update
CREATE POLICY "Anyone can view questions"
  ON questions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create questions"
  ON questions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update questions"
  ON questions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete questions"
  ON questions FOR DELETE
  TO anon, authenticated
  USING (true);

-- Exam attempts: anyone can read and insert (students submit results)
CREATE POLICY "Anyone can view attempts"
  ON exam_attempts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can submit attempts"
  ON exam_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
