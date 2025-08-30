// src/pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        alert("Signup successful! Please login.");
        navigate("/login");
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Something went wrong!");
    }
  };

  return (
    <>
      <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: linear-gradient(135deg, #f8fafc, #e0e7ff);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }
        .auth-card {
          width: 100%;
          max-width: 380px;
          padding: 2rem;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        .auth-title {
          font-size: 1.8rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 1.5rem;
        }
        .auth-input {
          width: 100%;
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .auth-input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
        }
        .auth-button {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          background: #16a34a;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .auth-button:hover {
          background: #15803d;
        }
        .auth-footer {
          margin-top: 1rem;
          font-size: 0.9rem;
          color: #374151;
        }
        .auth-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
        }
        .auth-link:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="auth-container">
        <div className="auth-card">
          <h2 className="auth-title">Create Account</h2>
          <input
            type="text"
            placeholder="Username"
            className="auth-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleSignup} className="auth-button">
            Signup
          </button>
          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
