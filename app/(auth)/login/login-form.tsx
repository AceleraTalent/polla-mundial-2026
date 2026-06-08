"use client";

import { useState, useTransition } from "react";
import { login, signup } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Tab = "login" | "signup";

function Field({
  label, name, type, placeholder, autoComplete,
}: {
  label: string; name: string; type: string;
  placeholder: string; autoComplete: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      <Label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{label}</Label>
      <Input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        autoComplete={autoComplete}
        style={{
          height: 52, width: "100%", borderRadius: 12,
          border: "1.5px solid #E5E7EB", background: "#F9FAFB",
          padding: "0 16px", fontSize: 15,
        }}
      />
    </div>
  );
}

export function LoginForm() {
  const [tab, setTab] = useState<Tab>("login");
  const [loginErr,  setLoginErr]  = useState<string | null>(null);
  const [signupErr, setSignupErr] = useState<string | null>(null);
  const [signupMsg, setSignupMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginErr(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await login({}, fd);
      if (res?.error) setLoginErr(res.error);
    });
  }

  function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSignupErr(null);
    setSignupMsg(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await signup({}, fd);
      if (res?.error) setSignupErr(res.error);
      if (res?.message) setSignupMsg(res.message);
    });
  }

  const btnBase: React.CSSProperties = {
    flex: 1, height: 46, borderRadius: 10, fontSize: 14,
    fontWeight: 700, cursor: "pointer", border: "none", transition: "all 0.15s",
  };
  const activeStyle: React.CSSProperties = {
    ...btnBase, background: "white", color: "#0d1b2e",
    boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
  };
  const inactiveStyle: React.CSSProperties = {
    ...btnBase, background: "transparent", color: "#6B7280",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>

      {/* Tab switcher */}
      <div style={{
        display: "flex", background: "#F3F4F6", borderRadius: 12,
        padding: 4, gap: 4, width: "100%",
      }}>
        <button
          type="button"
          style={tab === "login" ? activeStyle : inactiveStyle}
          onClick={() => { setTab("login"); setLoginErr(null); }}
        >
          Ingresar
        </button>
        <button
          type="button"
          style={tab === "signup" ? activeStyle : inactiveStyle}
          onClick={() => { setTab("signup"); setSignupErr(null); setSignupMsg(null); }}
        >
          Crear cuenta
        </button>
      </div>

      {/* Login form */}
      {tab === "login" && (
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
          <Field label="Correo electrónico" name="email" type="email"
            placeholder="tu@correo.com" autoComplete="email" />
          <Field label="Contraseña" name="password" type="password"
            placeholder="Mínimo 6 caracteres" autoComplete="current-password" />

          {loginErr && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FCA5A5",
              borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#B91C1C",
            }}>
              {loginErr}
            </div>
          )}

          <Button
            type="submit" disabled={pending}
            style={{
              width: "100%", height: 52, borderRadius: 12,
              background: "#0d1b2e", color: "white",
              fontSize: 15, fontWeight: 700, marginTop: 4,
            }}
          >
            {pending ? "Procesando…" : "Ingresar →"}
          </Button>
        </form>
      )}

      {/* Signup form */}
      {tab === "signup" && (
        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
          <Field label="Correo electrónico" name="email" type="email"
            placeholder="tu@correo.com" autoComplete="email" />
          <Field label="Contraseña" name="password" type="password"
            placeholder="Mínimo 6 caracteres" autoComplete="new-password" />

          {signupErr && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FCA5A5",
              borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#B91C1C",
            }}>
              {signupErr}
            </div>
          )}
          {signupMsg && (
            <div style={{
              background: "#ECFDF5", border: "1px solid #6EE7B7",
              borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#065F46",
            }}>
              {signupMsg}
            </div>
          )}

          <Button
            type="submit" disabled={pending}
            style={{
              width: "100%", height: 52, borderRadius: 12,
              background: "#0d1b2e", color: "white",
              fontSize: 15, fontWeight: 700, marginTop: 4,
            }}
          >
            {pending ? "Procesando…" : "Crear cuenta →"}
          </Button>

          <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
            Al registrarte aceptas jugar con fair play 🤝
          </p>
        </form>
      )}
    </div>
  );
}
