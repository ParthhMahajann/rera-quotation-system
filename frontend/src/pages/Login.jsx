import React, { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("fname", data.fname);
        localStorage.setItem("lname", data.lname);
        localStorage.setItem("username", data.username);
        localStorage.setItem("threshold", data.threshold || 0);
        window.location.href = "/";
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Login failed");
    }
  };

  return (
    <div className="auth-container">
      <style>{`
        .auth-container {
          max-width: 400px;
          margin: 80px auto;
          padding: 30px;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
          text-align: center;
        }
        .auth-input {
          width: 100%;
          padding: 10px;
          margin-bottom: 15px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
        }
        .auth-button {
          width: 100%;
          padding: 10px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .auth-button:hover { background: #1d4ed8; }
      `}</style>

      <h2>Login</h2>
      <input className="auth-input" placeholder="Username" value={username} onChange={(e)=>setUsername(e.target.value)} />
      <input type="password" className="auth-input" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button onClick={handleLogin} className="auth-button">Login</button>
      {message && <p>{message}</p>}
    </div>
  );
}
