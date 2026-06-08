"use client";

import Image from "next/image";
import { useState, useTransition } from "react";

import { saveOnboarding } from "@/app/actions/onboarding";
import { AVATARS } from "@/lib/avatars";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingForm({ defaultNickname }: { defaultNickname: string }) {
  const [selected, setSelected] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveOnboarding({}, fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              name="nickname"
              defaultValue={defaultNickname}
              placeholder="ElCrackDeLaPolla"
              maxLength={20}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Avatar</Label>
            <input type="hidden" name="avatar_id" value={selected} />
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {AVATARS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelected(a.id)}
                  title={a.displayName}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-full border-2 transition",
                    selected === a.id
                      ? "border-emerald-600 ring-2 ring-emerald-400"
                      : "border-transparent hover:border-muted-foreground/40",
                  )}
                >
                  <Image src={a.file} alt={a.displayName} width={80} height={80} className="h-full w-full" />
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={isPending || !selected}>
            {isPending ? "Guardando…" : "Entrar a la Polla"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
