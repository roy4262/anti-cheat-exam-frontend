import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AssignedExam, Exam } from "../models/exam-models";

export interface ExamStore {
  activeExam: {
    exam: Exam;
    currentQuestion: number;
    leftExamCount: number;
    tabChangeCount: number;
    didLeaveExam?: boolean;
    answerKeys: any[];
    countdown?: any;
    expiresOn: number;
  } | null;
  assignedExams: AssignedExam[];
}

const initialState: ExamStore = {
  activeExam: null,
  assignedExams: [],
};

const examSlice = createSlice({
  name: "exam",
  initialState,
  reducers: {
    setActiveExam: (state: ExamStore, action: PayloadAction<Exam>) => {
      // Validate the exam data
      const exam = action.payload;

      if (!exam) {
        console.error('Attempted to set null or undefined exam');
        return;
      }

      // Make sure questions array exists
      if (!exam.questions) {
        console.error('Exam has no questions array');
        exam.questions = [];
      }

      // Ensure questionCount is accurate
      const actualQuestionCount = exam.questions.length;
      if (exam.questionCount !== actualQuestionCount) {
        console.warn(`Exam questionCount (${exam.questionCount}) doesn't match actual questions length (${actualQuestionCount})`);
        exam.questionCount = actualQuestionCount;
      }

      // Ensure exam duration is valid
      const duration = typeof exam.duration === 'number' && exam.duration > 0
        ? exam.duration
        : 60; // Default to 60 minutes if invalid

      console.log(`Setting up exam with duration: ${duration} minutes`);

      // Calculate expiration time
      const now = new Date();
      const expiresOn = now.getTime() + (duration * 60 * 1000); // Convert minutes to milliseconds

      console.log(`Exam will expire at: ${new Date(expiresOn).toISOString()}`);

      const activeExam: ExamStore["activeExam"] = {
        exam: exam,
        currentQuestion: 0,
        leftExamCount: 0,
        tabChangeCount: 0,
        didLeaveExam: false,
        answerKeys: Array(exam.questionCount).fill(null),
        countdown: "",
        expiresOn: expiresOn,
      };

      state.activeExam = activeExam;
      console.log('Active exam set with', exam.questionCount, 'questions');
    },

    clearActiveExam: (state: ExamStore) => {
      state.activeExam = null;
    },

    goToQuestion: (state: ExamStore, action: PayloadAction<number>) => {
      // Check if activeExam exists
      if (!state.activeExam) {
        console.error('Cannot go to question: No active exam');
        return;
      }

      const questionNo = action.payload;
      const { exam } = state.activeExam;

      // Get the actual number of questions
      const actualQuestionCount = exam.questions ? exam.questions.length : 0;

      console.log(`Go to question: Target=${questionNo + 1}, Total=${actualQuestionCount}`);

      // Check if the target question is valid
      if (questionNo < 0 || questionNo >= actualQuestionCount) {
        console.error(`Invalid question number: ${questionNo + 1}, total questions: ${actualQuestionCount}`);
        return;
      }

      // Set the current question
      state.activeExam.currentQuestion = questionNo;
      console.log(`Moved to question ${questionNo + 1}`);
    },

    nextQuestion: (state: ExamStore) => {
      // Check if activeExam exists
      if (!state.activeExam) {
        console.error('Cannot go to next question: No active exam');
        return;
      }

      const { exam, currentQuestion } = state.activeExam;

      // Get the actual number of questions
      const actualQuestionCount = exam.questions ? exam.questions.length : 0;

      console.log(`Next question: Current=${currentQuestion}, Total=${actualQuestionCount}`);

      // Check if we're already at the last question
      if (currentQuestion + 1 >= actualQuestionCount) {
        console.log('Already at the last question, cannot go next');
        return;
      }

      // Move to the next question
      state.activeExam.currentQuestion += 1;
      console.log(`Moved to question ${state.activeExam.currentQuestion + 1}`);
    },

    prevQuestion: (state: ExamStore) => {
      // Check if activeExam exists
      if (!state.activeExam) {
        console.error('Cannot go to previous question: No active exam');
        return;
      }

      const { exam, currentQuestion } = state.activeExam;

      console.log(`Previous question: Current=${currentQuestion}`);

      // Check if we're already at the first question
      if (currentQuestion <= 0) {
        console.log('Already at the first question, cannot go previous');
        return;
      }

      // Move to the previous question
      state.activeExam.currentQuestion -= 1;
      console.log(`Moved to question ${state.activeExam.currentQuestion + 1}`);
    },

    setAnswer: (
      state: ExamStore,
      action: PayloadAction<{ questionNo: number; answerKey: string }>
    ) => {
      // Check if activeExam exists
      if (!state.activeExam) {
        console.error('Cannot set answer: No active exam');
        return;
      }

      const { questionNo, answerKey } = action.payload;

      // Validate question number
      if (!state.activeExam.exam || !state.activeExam.exam.questionCount) {
        console.error('Cannot set answer: Invalid exam data');
        return;
      }

      if (questionNo < 0 || questionNo >= state.activeExam.exam.questionCount) {
        console.error(`Invalid question number: ${questionNo}, total questions: ${state.activeExam.exam.questionCount}`);
        return;
      }

      // Ensure answerKeys array exists
      if (!state.activeExam.answerKeys) {
        console.error('Answer keys array is missing, initializing it');
        state.activeExam.answerKeys = Array(state.activeExam.exam.questionCount).fill(null);
      }

      // Set the answer
      state.activeExam.answerKeys[questionNo] = answerKey;

      // Log for debugging
      console.log(`Answer set for question ${questionNo + 1}: ${answerKey}`);

      // Also store in localStorage for redundancy
      try {
        if (state.activeExam.exam && state.activeExam.exam._id) {
          const key = `exam_${state.activeExam.exam._id}_answers`;
          localStorage.setItem(key, JSON.stringify(state.activeExam.answerKeys));
        }
      } catch (e) {
        console.error('Error storing answers in localStorage:', e);
      }
    },

    setAssignedExams: (
      state: ExamStore,
      action: PayloadAction<AssignedExam[]>
    ) => {
      state.assignedExams = action.payload;
    },

    clearAssignedExams: (state: ExamStore) => {
      state.assignedExams = [];
    },

    increaseTabChangeCount: (state: ExamStore) => {
      if (!state.activeExam) {
        console.error('Cannot increase tab change count: No active exam');
        return;
      }

      // Only count tab changes if we're in an active exam
      if (state.activeExam.exam && state.activeExam.exam._id) {
        // Ensure the current count is a valid number
        const oldCount = typeof state.activeExam.tabChangeCount === 'number' ? state.activeExam.tabChangeCount : 0;

        // Increment the count
        state.activeExam.tabChangeCount = oldCount + 1;
        const newCount = state.activeExam.tabChangeCount;

        console.log(`TAB CHANGE COUNT UPDATED in Redux store: ${oldCount} -> ${newCount}`);

        // Also store in localStorage for redundancy
        try {
          const key = `exam_${state.activeExam.exam._id}_tab_switches`;
          localStorage.setItem(key, newCount.toString());
          console.log(`Stored tab change count in localStorage with key: ${key}`);

          // Check if we need to sync with localStorage (in case there's a higher value there)
          const storedCount = localStorage.getItem(key);
          if (storedCount) {
            const parsedStoredCount = parseInt(storedCount, 10);
            if (!isNaN(parsedStoredCount) && parsedStoredCount > newCount) {
              console.log(`Found higher tab change count in localStorage: ${parsedStoredCount} > ${newCount}`);
              state.activeExam.tabChangeCount = parsedStoredCount;
            }
          }
        } catch (e) {
          console.error('Error handling tab change count in localStorage:', e);
        }
      }
    },
  },
});

const examActions = examSlice.actions;

export default examSlice;
export { examActions };
