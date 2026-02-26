import { configureStore } from '@reduxjs/toolkit';
import ordersReducer from './slices/ordersSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
