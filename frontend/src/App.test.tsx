import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renders the calendar landing page", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Calendar" }),
    ).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: "Записаться" })) {
      expect(link).toHaveAttribute("href", "#");
    }
    expect(
      screen.getByRole("heading", { name: "Что доступно прямо сейчас" }),
    ).toBeInTheDocument();
  });
});
