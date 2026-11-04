
import React, { useState } from "react";

import Login from "./components/Login";
import Register from "./components/Register";
import AdminDashboard from "./pages/AdminDashboard";
import PhotoGalleryWorkspace from "./pages/PhotoGalleryWorkspace";

import "./AppShell.css";
import "./components/Auth.css";

function readLoggedInUser() {
  try {
    const token = localStorage.getItem("photoGalleryToken");
    const storedUser = localStorage.getItem("loggedInUser");

    if (!token || !storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Unable to read logged-in user:", error);
    return null;
  }
}

function App() {
  const [currentUser, setCurrentUser] = useState(readLoggedInUser);
  const [authPage, setAuthPage] = useState("login");
  const [activeModule, setActiveModule] = useState("workspace");

  function handleLoginComplete(user) {
    setCurrentUser(user);
    setActiveModule("workspace");
  }

  function handleProfileUpdate(updatedProfile) {
    const updatedUser = {
      ...(currentUser || {}),
      ...updatedProfile,
    };

    localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  }

  function handleLogout() {
    localStorage.removeItem("photoGalleryToken");
    localStorage.removeItem("loggedInUser");

    setCurrentUser(null);
    setAuthPage("login");
    setActiveModule("workspace");
  }

  if (!currentUser) {
    return authPage === "register" ? (
      <Register
        goToLogin={() => setAuthPage("login")}
      />
    ) : (
      <Login
        goToRegister={() => setAuthPage("register")}
        goToGallery={handleLoginComplete}
      />
    );
  }

  return (
    <div className="app-shell">

      <header className="app-shell-header">

        <div className="app-shell-brand">
          <span className="app-shell-brand-icon">📸</span>

          <div>
            <strong>PhotoGallery</strong>
            <small>Capture · Organise · Remember</small>
          </div>
        </div>

        <nav className="app-shell-nav">

          <button
            type="button"
            className={activeModule === "workspace" ? "active" : ""}
            onClick={() => setActiveModule("workspace")}
          >
            My Workspace
          </button>

          {currentUser.role === "admin" && (
            <button
              type="button"
              className={activeModule === "admin" ? "active" : ""}
              onClick={() => setActiveModule("admin")}
            >
              Admin Dashboard
            </button>
          )}

        </nav>

        <div className="app-shell-user">
          <span>Hi, {currentUser.name || "User"}</span>

          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>

      </header>

      {activeModule === "admin" ? (
        <AdminDashboard />
      ) : (
        <PhotoGalleryWorkspace
          currentUser={currentUser}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      <div className="app-shell-demo-note">
        Photo Gallery Application · Advanced Web Technology
      </div>

    </div>
  );
}

export default App;
