import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../models/auth-models";

export interface UserState {
  user: User | null;
  isLoggedIn: boolean;
}

const initialState: UserState = {
  user: null,
  isLoggedIn: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state: UserState, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isLoggedIn = true;
    },
    removeUser: (state: UserState) => {
      state.user = null;
      state.isLoggedIn = false;
    },
  },
});

const userActions = userSlice.actions;

export default userSlice;
export { userActions };
