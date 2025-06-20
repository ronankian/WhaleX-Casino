import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const bgUrl = "/images/bg.png";
const logoUrl = "/images/brand.png";
const brandColor = "#00eaff";
const brandColorHover = "#1de9b6";

export default function Register() {
  const [, setLocation] = useLocation();
  const { register, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!username || !email || !password || !confirmPassword) {
        setError("Please fill in all fields.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      await register(username, email, password);
      // No direct setLocation here; redirect will happen in useEffect
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `url(${bgUrl}) center/cover no-repeat, #18181b`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={handleRegister}
        className="flex flex-col items-center bg-black/70 rounded-xl p-10 shadow-lg w-full max-w-md"
      >
        <img
          src={logoUrl}
          alt="WhaleXCasino"
          className="w-48 h-20 mb-6 cursor-pointer"
          style={{ objectFit: "contain" }}
          onClick={() => setLocation("/")}
        />
        <h2 className="text-2xl font-bold text-white mb-6">Create your account</h2>
        <input
          type="text"
          placeholder="Username"
          className="mb-4 px-4 py-2 rounded bg-gray-900 text-white w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="mb-4 px-4 py-2 rounded bg-gray-900 text-white w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="mb-4 px-4 py-2 rounded bg-gray-900 text-white w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="mb-6 px-4 py-2 rounded bg-gray-900 text-white w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <button
          type="submit"
          style={{ backgroundColor: brandColor, color: "#18181b" }}
          className="w-full py-2 rounded font-semibold hover:brightness-110 transition mb-4"
          disabled={loading}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = brandColorHover)}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = brandColor)}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <div className="text-gray-400 text-sm">
          Already have an account?{' '}
          <span
            className="text-cyan-400 cursor-pointer hover:underline"
            onClick={() => setLocation("/login")}
          >
            Login here
          </span>
        </div>
      </form>
    </div>
  );
} 