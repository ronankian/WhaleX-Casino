import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const bgUrl = "/images/bg.png";
const logoUrl = "/images/brand.png";
const brandColor = "#00eaff";
const brandColorHover = "#1de9b6";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/home");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast({
        title: "Success!",
        description: "You have successfully logged in.",
        className: "bg-black/90 border-zinc-700 text-white",
      });
      // No direct setLocation here; redirect will happen in useEffect
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err?.message || "Invalid credentials. Please try again.",
        className: "bg-black/90 border-red-500 text-white",
      });
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
        onSubmit={handleLogin}
        className="flex flex-col items-center bg-black/70 rounded-xl p-10 shadow-lg w-full max-w-md"
      >
        <img
          src={logoUrl}
          alt="WhaleXCasino"
          className="w-48 h-20 mb-6 cursor-pointer"
          style={{ objectFit: "contain" }}
          onClick={() => setLocation("/")}
        />
        <h2 className="text-2xl font-bold text-white mb-6">Login to your account</h2>
        <input
          type="text"
          placeholder="Username"
          className="mb-4 px-4 py-2 rounded bg-gray-900 text-white w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="mb-6 px-4 py-2 rounded bg-gray-900 text-white w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          type="submit"
          style={{ backgroundColor: brandColor, color: "#18181b" }}
          className="w-full py-2 rounded font-semibold hover:brightness-110 transition mb-4"
          disabled={loading}
          onMouseOver={e => (e.currentTarget.style.backgroundColor = brandColorHover)}
          onMouseOut={e => (e.currentTarget.style.backgroundColor = brandColor)}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <div className="text-gray-400 text-sm">
          Don't have an account?{' '}
          <span
            className="text-cyan-400 cursor-pointer hover:underline"
            onClick={() => setLocation("/register")}
          >
            Register here
          </span>
        </div>
      </form>
    </div>
  );
} 