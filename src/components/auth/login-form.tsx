"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error || "Could not login.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="auth-form form-grid" onSubmit={onSubmit}>
      <label>
        Email or username
        <input name="emailOrUsername" required />
      </label>
      <label>
        Password
        <input name="password" type="password" required />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="button" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
