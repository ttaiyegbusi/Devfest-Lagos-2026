"use client";

import { useId, useRef, useState } from "react";

/* The sign-up box. It used to be `action="#"`, which meant pressing Enter
   navigated to "#" and reloaded the page — the address went nowhere and the
   only feedback was the page jumping to the top.

   Whether an address is actually stored is app/api/subscribe/route.ts's
   problem; this component's job is to say truthfully what happened. */

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done" }
  | { kind: "failed"; message: string };

export function SignupForm() {
  const id = useId();
  const [state, setState] = useState<State>({ kind: "idle" });
  const input = useRef<HTMLInputElement>(null);

  const statusId = `${id}-status`;
  const failed = state.kind === "failed";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.kind === "sending") return;

    const email = input.current?.value.trim() ?? "";
    // The browser's own required/type=email check runs first; this catches the
    // case where it is bypassed, and saves a round trip.
    if (!email) {
      setState({ kind: "failed", message: "Enter an email address." });
      input.current?.focus();
      return;
    }

    setState({ kind: "sending" });
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body: { error?: string } = await response.json().catch(() => ({}));

      if (!response.ok) {
        setState({
          kind: "failed",
          message: body.error ?? "Something went wrong. Please try again.",
        });
        input.current?.focus();
        return;
      }

      setState({ kind: "done" });
      if (input.current) input.current.value = "";
    } catch {
      setState({
        kind: "failed",
        message: "Could not reach the server. Check your connection.",
      });
      input.current?.focus();
    }
  }

  return (
    <>
      <form
        className="foot__form"
        onSubmit={onSubmit}
        noValidate={false}
        data-rise
      >
        <label className="visually-hidden" htmlFor={`${id}-email`}>
          Email address
        </label>
        <input
          ref={input}
          id={`${id}-email`}
          className="foot__input"
          type="email"
          name="email"
          placeholder="Enter your email"
          autoComplete="email"
          required
          aria-invalid={failed || undefined}
          aria-describedby={state.kind === "idle" ? undefined : statusId}
          onChange={() => state.kind !== "idle" && setState({ kind: "idle" })}
          disabled={state.kind === "sending"}
        />
        <button
          type="submit"
          className="foot__submit"
          disabled={state.kind === "sending"}
        >
          <span className="visually-hidden">
            {state.kind === "sending" ? "Signing up" : "Sign up"}
          </span>
          <svg
            width="20"
            height="14"
            viewBox="0 0 20 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M13 1l6 6-6 6M19 7H1"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>

      {/* Announced when it changes, so the outcome reaches a screen reader
          without moving focus away from the field. */}
      <p
        id={statusId}
        className="foot__status"
        data-tone={failed ? "bad" : state.kind === "done" ? "good" : undefined}
        role="status"
        aria-live="polite"
      >
        {state.kind === "sending" && "Signing you up…"}
        {state.kind === "done" && "You’re on the list. See you in Lagos."}
        {failed && state.message}
      </p>
    </>
  );
}
