// /store/root-reducer.ts
import { combineReducers } from '@reduxjs/toolkit';
import { reducer as globalReducer } from '../slices/global';

export const rootReducer = combineReducers({
  global: globalReducer
});
