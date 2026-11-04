
import React, { useState } from "react";
import api from "../services/api";

function Login({ goToRegister, goToGallery }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    try {
      setLoading(true);

      const response = await api.post("/api/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Invalid login response from server.");
      }

      localStorage.setItem("photoGalleryToken", token);
      localStorage.setItem("loggedInUser", JSON.stringify(user));

      goToGallery(user);

    } catch (error) {
      alert(
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">

        <div className="auth-logo">📸</div>

        <p className="auth-eyebrow">WELCOME BACK</p>

        <h1>Photo Gallery</h1>

        <p className="auth-subtitle">
          Sign in to manage your memories.
        </p>

        <form onSubmit={handleLogin}>

          <label htmlFor="login-email">Email address</label>

          <input
            id="login-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>

          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            className="auth-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Login"}
          </button>

        </form>

        <p className="auth-switch-text">
          Don't have an account?
        </p>

        <button
          className="auth-secondary"
          type="button"
          onClick={goToRegister}
        >
          Create Account
        </button>

      </section>
    </main>
  );
}

export default Login;
