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
          threshold: Math.min(Math.max(threshold, 0), 100),
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

  const inputStyle = {
    display: "block",
    width: "100%",
    margin: "10px 0",
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "16px",
    fontFamily: "inherit",
    transition: "border-color 0.3s ease",
    boxSizing: "border-box"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "5px",
    fontWeight: "600",
    color: "#333"
  };

  return (
    <div style={{ 
      maxWidth: "450px", 
      margin: "50px auto", 
      padding: "30px",
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <h2 style={{ 
        textAlign: "center", 
        marginBottom: "30px", 
        color: "#333",
        fontSize: "28px",
        fontWeight: "700"
      }}>
        Create Account
      </h2>
      
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>First Name</label>
        <input
          type="text"
          placeholder="Enter first name"
          value={fname}
          onChange={(e) => setFname(e.target.value)}
          style={inputStyle}
        />
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Last Name</label>
        <input
          type="text"
          placeholder="Enter last name"
          value={lname}
          onChange={(e) => setLname(e.target.value)}
          style={inputStyle}
        />
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Username</label>
        <input
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{
            ...inputStyle,
            cursor: "pointer"
          }}
        >
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <label style={labelStyle}>Discount Threshold (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
          style={inputStyle}
          placeholder="0"
        />
        <small style={{ 
          color: "#666", 
          fontSize: "14px", 
          display: "block", 
          marginTop: "5px",
          padding: "8px 12px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          border: "1px solid #e9ecef"
        }}>
          {role === "user" && "💡 Discounts within this limit will be auto-approved"}
          {role === "manager" && "🔒 Maximum discount percentage you can approve"}
          {role === "admin" && "👑 Can approve any discount regardless of this limit"}
        </small>
      </div>
      
      <button
        onClick={handleSignup}
        style={{
          width: "100%",
          padding: "14px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "600",
          transition: "background-color 0.3s ease"
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = "#0056b3"}
        onMouseOut={(e) => e.target.style.backgroundColor = "#007bff"}
      >
        Create {role.charAt(0).toUpperCase() + role.slice(1)}
      </button>
      
      {message && (
        <div style={{ 
          marginTop: "20px", 
          padding: "12px",
          borderRadius: "6px",
          textAlign: "center",
          fontWeight: "500",
          backgroundColor: message.includes("✅") ? "#d4edda" : "#f8d7da",
          color: message.includes("✅") ? "#155724" : "#721c24",
          border: message.includes("✅") ? "1px solid #c3e6cb" : "1px solid #f5c6cb"
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
