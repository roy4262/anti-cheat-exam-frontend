import { configureStore } from "@reduxjs/toolkit";
import examStoreSlice from "./exam-store";
import userSlice from "./user-store";

const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    exam: examStoreSlice.reducer,  // Using the exam-store for active exam functionality
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
