import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth-helpers";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const { profile } = await requireUser();
  if (profile?.is_onboarded) redirect("/predicciones");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-600 to-emerald-800 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-5 text-center text-white">
          <h1 className="text-2xl font-extrabold">¡Bienvenido a la Polla!</h1>
          <p className="text-emerald-100">
            Elige tu nickname y tu avatar para empezar.
          </p>
        </div>
        <OnboardingForm defaultNickname={profile?.nickname ?? ""} />
      </div>
    </main>
  );
}
