import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-copy">
        <p className="eyebrow">Welcome back</p>
        <h1>Open your Switchkrr dashboard.</h1>
        <p className="muted">Continue tracking Hustles, mentor requests, leads, and candidate progress.</p>
      </section>
      <section className="auth-card card">
        <LoginForm />
        <p className="auth-link muted">
          New to Switchkrr? <Link href="/signup">Create account</Link>
        </p>
      </section>
    </main>
  );
}
