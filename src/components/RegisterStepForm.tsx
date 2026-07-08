"use client";

import { useState } from "react";
import StepIndicator from "@/components/register-step-form/StepIndicator";
import NameStep from "@/components/register-step-form/NameStep";
import BirthDateStep from "@/components/register-step-form/BirthDateStep";
import ConfirmStep from "@/components/register-step-form/ConfirmStep";
import CompleteStep from "@/components/register-step-form/CompleteStep";
import type { FormData, Step } from "@/components/register-step-form/types";

const emptyForm: FormData = { lastName: "", firstName: "", birthDate: "" };

export default function RegisterStepForm() {
  const [step, setStep] = useState<Step>("name");
  const [form, setForm] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = (patch: Partial<FormData>) =>
    setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        throw new Error("登録に失敗しました。");
      }
      setStep("complete");
    } catch {
      setError("登録に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setForm(emptyForm);
    setStep("name");
    setError(null);
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-10">
      <StepIndicator step={step} />

      {step === "name" && (
        <NameStep
          form={form}
          onChange={updateForm}
          onNext={() => setStep("birthDate")}
        />
      )}

      {step === "birthDate" && (
        <BirthDateStep
          form={form}
          onChange={updateForm}
          onNext={() => setStep("confirm")}
          onBack={() => setStep("name")}
        />
      )}

      {step === "confirm" && (
        <ConfirmStep
          form={form}
          submitting={submitting}
          error={error}
          onBack={() => setStep("birthDate")}
          onSubmit={handleSubmit}
        />
      )}

      {step === "complete" && (
        <CompleteStep form={form} onRestart={handleRestart} />
      )}
    </div>
  );
}
