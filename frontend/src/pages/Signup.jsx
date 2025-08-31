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

      <h2>Signup</h2>
      <input className="auth-input" placeholder="First Name" value={fname} onChange={(e)=>setFname(e.target.value)} />
      <input className="auth-input" placeholder="Last Name" value={lname} onChange={(e)=>setLname(e.target.value)} />
      <input className="auth-input" placeholder="Username" value={username} onChange={(e)=>setUsername(e.target.value)} />
      <input type="password" className="auth-input" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />

      <select className="auth-input" value={role} onChange={(e)=>setRole(e.target.value)}>
        <option value="user">User</option>
        <option value="manager">Manager</option>
      </select>

      {role==="manager" && (
        <input type="number" className="auth-input" min="0" max="100" value={threshold} onChange={(e)=>setThreshold(e.target.value)} placeholder="Threshold % (0-100)" />
      )}

      <button onClick={handleSignup} className="auth-button">Signup</button>
      {message && <p>{message}</p>}
    </div>
  );
}
