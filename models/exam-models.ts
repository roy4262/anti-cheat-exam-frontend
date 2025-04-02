export interface Question {
  question?: string;
  text?: string;
  title?: string;
  options: string[] | Record<string, string>;
  correctAnswer?: string;
}

export interface Exam {
  questions: Question[];
  questionCount: number;
  _id: string;
  examId: string;
  name: string;
  startDate: string;
  endDate: string;
  duration: number;
  description?: string;
}

export interface AssignedExam {
  _id: string;
  examId: string;
  name: string;
  startDate: string;
  endDate: string;
  duration: number;
  questionCount?: number;
  description?: string;
  status?: string;
}
