import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import App from "./App";
import { createTestStore } from "./tests/utils/testStore";

test("renders the app", () => {
  const store = createTestStore();

  render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
});
