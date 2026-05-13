export interface Database {
  public: {
    Tables: {
      exams: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          duration_minutes: number;
          negative_marking_enabled: boolean;
          negative_marking_value: number;
          marks_per_question: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          duration_minutes: number;
          negative_marking_enabled?: boolean;
          negative_marking_value?: number;
          marks_per_question?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          duration_minutes?: number;
          negative_marking_enabled?: boolean;
          negative_marking_value?: number;
          marks_per_question?: number;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          exam_id: string;
          text: string;
          options: string[];
          correct_option: number;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          text: string;
          options: string[];
          correct_option: number;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          exam_id?: string;
          text?: string;
          options?: string[];
          correct_option?: number;
          order_index?: number;
        };
      };
      exam_attempts: {
        Row: {
          id: string;
          exam_id: string;
          student_name: string;
          answers: Record<string, number>;
          score: number;
          total_marks: number;
          correct_count: number;
          wrong_count: number;
          skipped_count: number;
          negative_marks_deducted: number;
          time_taken_seconds: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          student_name: string;
          answers: Record<string, number>;
          score: number;
          total_marks: number;
          correct_count: number;
          wrong_count: number;
          skipped_count: number;
          negative_marks_deducted: number;
          time_taken_seconds: number;
          completed_at?: string;
        };
        Update: Record<string, never>;
      };
    };
  };
}
