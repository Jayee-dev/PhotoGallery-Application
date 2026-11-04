import { render, screen } from "@testing-library/react";
import App from "./App";

test("shows the Photo Gallery login screen when no one is signed in", () => {
  localStorage.removeItem("loggedInUser");
  render(<App />);
  expect(screen.getByRole("heading", { name: /photo gallery/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
});
