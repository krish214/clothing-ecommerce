"use client";

import { useState, type FormEvent } from "react";

export default function AdminLogin({ showDefault }: { showDefault: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setPending(false);
    if (!res.ok) {
      setError("That password is not right.");
      return;
    }
    window.location.href = "/admin";
  }

  return (
    <div className="admin wrap">
      <p className="eyebrow">Shop admin</p>
      <h1 className="h1">Add clothes</h1>
      <p className="lede">Sign in to put a new piece on the shop floor.</p>
      <form className="co-form admin-login" onSubmit={onSubmit}>
        <fieldset>
          <legend>Password</legend>
          <div className="field">
            <label htmlFor="admin-password">Admin password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {showDefault && (
            <p className="fine admin-hint">
              Local password is <b className="code">loom-admin</b>. Set <b className="code">ADMIN_PASSWORD</b> in .env.local to change it.
            </p>
          )}
          {error && <p className="form-error">{error}</p>}
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? "Checking…" : "Sign in"}
          </button>
        </fieldset>
      </form>
    </div>
  );
}
