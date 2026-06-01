import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <main className="auth-shell">
      <section className="auth-copy">
        <p className="eyebrow">Create account</p>
        <h1>Start as a candidate or mentor.</h1>
        <p className="muted">
          Candidates build a switching profile. Mentors get a unique code and can approve Hustle requests.
        </p>
      </section>
      <section className="auth-card card">
        <SignupForm />
        <p className="auth-link muted">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
