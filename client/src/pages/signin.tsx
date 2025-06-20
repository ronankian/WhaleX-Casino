import React from "react";
import { useLocation } from "wouter";

const bgUrl = "/images/bg.png";
const logoUrl = "/images/brand.png";
const brandColor = "#00eaff"; // Matches the X in the logo
const brandColorHover = "#1de9b6"; // Slightly lighter for hover

export default function SignIn() {
  const [, setLocation] = useLocation();

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
      <div className="flex flex-col items-center bg-black/70 rounded-xl p-10 shadow-lg">
        <img src={logoUrl} alt="WhaleXCasino" className="w-48 h-20 mb-6" style={{ objectFit: "contain" }} />
        <p className="text-lg text-gray-300 mb-8">Please log in to access the casino</p>
        <div className="flex gap-4">
          <button
            style={{ backgroundColor: brandColor, color: "#18181b" }}
            className="px-6 py-2 rounded font-semibold hover:brightness-110 transition"
            onClick={() => setLocation("/login")}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = brandColorHover)}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = brandColor)}
          >
            Login
          </button>
          <button
            style={{ border: `2px solid ${brandColor}`, color: brandColor, background: "transparent" }}
            className="px-6 py-2 rounded font-semibold hover:bg-[#00eaff] hover:text-[#18181b] transition"
            onClick={() => setLocation("/register")}
            onMouseOver={e => {
              e.currentTarget.style.backgroundColor = brandColorHover;
              e.currentTarget.style.color = "#18181b";
            }}
            onMouseOut={e => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = brandColor;
            }}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
} 