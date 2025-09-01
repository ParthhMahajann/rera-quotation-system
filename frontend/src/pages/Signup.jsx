import React, { useState } from "react";

export default function Signup() {
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [threshold, setThreshold] = useState(0);
  const [message, setMessage] = useState("");

  const handleSignup = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fname,
          lname,
          username,
          password,
          role,
          threshold: role === "manager" ? Math.min(Math.max(threshold, 0), 100) : 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ ${role} created successfully`);
        setFname("");
        setLname("");
        setUsername("");
        setPassword("");
        setRole("user");
        setThreshold(0);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Failed to signup");
    }
  };

  return (
    <div className="signup-container">
      <style>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background: #f7f9fc;
        }
        .signup-container {
          max-width: 420px;
          margin: 80px auto;
          padding: 40px 30px;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
          text-align: center;
        }
        h2 {
          margin-bottom: 20px;
          color: #1e293b;
        }
        .signup-input {
          width: 100%;
          padding: 12px 14px;
          margin-bottom: 15px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
        }
        .signup-select {
          width: 100%;
          padding: 12px 14px;
          margin-bottom: 15px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
        }
        .signup-button {
          width: 100%;
          padding: 12px;
          margin-top: 10px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease-in-out;
        }
        .signup-button:hover { background: #1d4ed8; }
        .message {
          margin-top: 15px;
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>

      <h2>Create Account</h2>
      <input
        className="signup-input"
        placeholder="First Name"
        value={fname}
        onChange={(e) => setFname(e.target.value)}
      />
      <input
        className="signup-input"
        placeholder="Last Name"
        value={lname}
        onChange={(e) => setLname(e.target.value)}
      />
      <input
        className="signup-input"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        className="signup-input"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <select
        className="signup-select"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="user">User</option>
        <option value="manager">Manager</option>
      </select>

      {role === "manager" && (
        <input
          type="number"
          className="signup-input"
          min="0"
          max="100"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder="Threshold % (0-100)"
        />
      )}

      <button onClick={handleSignup} className="signup-button">
        Signup
      </button>
      {message && <p className="message">{message}</p>}
    </div>
  );
}
