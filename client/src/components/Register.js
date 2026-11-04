
import React, { useState } from "react";
import api from "../services/api";

function Register({ goToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();

    if (password.length < 6) {
      alert("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/api/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      alert(response.data.message || "Registration successful.");

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      goToLogin();

    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">

        <div className="auth-logo">📸</div>

        <p className="auth-eyebrow">JOIN THE COMMUNITY</p>

        <h1>Create Account</h1>

        <p className="auth-subtitle">
          Create an account for your photo memories.
        </p>

        <form onSubmit={handleRegister}>

          <label htmlFor="register-name">Full name</label>

          <input
            id="register-name"
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label htmlFor="register-email">Email address</label>

          <input
            id="register-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="register-password">Password</label>

          <input
            id="register-password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label htmlFor="register-confirm">Confirm password</label>

          <input
            id="register-confirm"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            className="auth-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>

        </form>

        <p className="auth-switch-text">
          Already have an account?
        </p>

        <button
          className="auth-secondary"
          type="button"
          onClick={goToLogin}
        >
          Back to Login
        </button>

      </section>
    </main>
  );
}

export default Register;
