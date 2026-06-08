import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#1a0533",
      }}
    >
      {/* ── Fondo: foto oficial WC2026 ── */}
      <Image
        src="/wc2026-bg.webp"
        alt="FIFA World Cup 2026"
        fill
        priority
        style={{ objectFit: "cover", objectPosition: "center" }}
      />

      {/* Overlay oscuro para legibilidad del card */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(26,5,51,0.72) 0%, rgba(180,20,20,0.55) 50%, rgba(30,80,0,0.60) 100%)",
        }}
      />

      {/* ── Card central ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 460,
          margin: "0 16px",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Cabecera oscura */}
        <div
          style={{
            background: "#0d1b2e",
            padding: "40px 36px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Trofeo SVG */}
          <svg viewBox="0 0 100 120" width="70" height="84" aria-hidden="true">
            <defs>
              <linearGradient id="gold1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stopColor="#FFE566"/>
                <stop offset="45%"  stopColor="#D4A017"/>
                <stop offset="100%" stopColor="#8B6000"/>
              </linearGradient>
            </defs>
            <rect x="25" y="106" width="50" height="8"  rx="3" fill="url(#gold1)"/>
            <rect x="30" y="96"  width="40" height="12" rx="2" fill="url(#gold1)"/>
            <rect x="40" y="72"  width="20" height="26" rx="4" fill="url(#gold1)"/>
            <path d="M18 10 Q18 6 22 6 L78 6 Q82 6 82 10 L79 58 Q77 70 50 72 Q23 70 21 58Z" fill="url(#gold1)"/>
            <path d="M18 16 Q4 22 4 36 Q4 50 18 54" fill="none" stroke="url(#gold1)" strokeWidth="5" strokeLinecap="round"/>
            <path d="M82 16 Q96 22 96 36 Q96 50 82 54" fill="none" stroke="url(#gold1)" strokeWidth="5" strokeLinecap="round"/>
            <ellipse cx="38" cy="24" rx="10" ry="6" fill="white" opacity="0.22" transform="rotate(-20 38 24)"/>
          </svg>

          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", color: "#00C8E0", textTransform: "uppercase", margin: 0 }}>
              FIFA World Cup 2026™
            </p>
            <h1 style={{ marginTop: 6, fontSize: 30, fontWeight: 900, color: "white", lineHeight: 1.1 }}>
              Polla Mundial
            </h1>
            <p style={{ marginTop: 6, fontSize: 14, color: "rgba(180,210,255,0.75)" }}>
              Predice · Compite · Gana
            </p>
          </div>
        </div>

        {/* Formulario blanco */}
        <div
          style={{
            background: "white",
            padding: "32px 36px 36px",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
