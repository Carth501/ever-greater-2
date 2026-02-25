import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import App from "./App";
import authReducer from "./store/slices/authSlice";
import errorReducer from "./store/slices/errorSlice";
import ticketReducer from "./store/slices/ticketSlice";

test("renders the app", () => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      ticket: ticketReducer,
      error: errorReducer,
    },
  });

  render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
});
