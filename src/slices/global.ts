// /slices/global.ts

import { createSlice } from '@reduxjs/toolkit';

interface GlobalState {
  chatRefreshKey: number;  // Used to trigger re-fetch of chat data
}

const initialState: GlobalState = {
  chatRefreshKey: 0
};

const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    incrementChatRefresh(state) {
      state.chatRefreshKey += 1;
    }
  }
});

// Export the slice reducer
export const { reducer } = globalSlice;

// Export the action so components can dispatch it
export const { incrementChatRefresh } = globalSlice.actions;
