import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AssignedExam } from '../models/exam-models';

interface ExamState {
  assignedExams: AssignedExam[];
  currentExam: AssignedExam | null;
  loading: boolean;
  error: string | null;
}

const initialState: ExamState = {
  assignedExams: [],
  currentExam: null,
  loading: false,
  error: null
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    setAssignedExams(state, action: PayloadAction<AssignedExam[]>) {
      state.assignedExams = action.payload;
    },
    setCurrentExam(state, action: PayloadAction<AssignedExam | null>) {
      state.currentExam = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    addExam(state, action: PayloadAction<AssignedExam>) {
      state.assignedExams.push(action.payload);
    },
    removeExam(state, action: PayloadAction<string>) {
      state.assignedExams = state.assignedExams.filter(exam => exam._id !== action.payload);
    },
    updateExam(state, action: PayloadAction<AssignedExam>) {
      const index = state.assignedExams.findIndex(exam => exam._id === action.payload._id);
      if (index !== -1) {
        state.assignedExams[index] = action.payload;
      }
    }
  }
});

export const examActions = examSlice.actions;
export default examSlice.reducer;