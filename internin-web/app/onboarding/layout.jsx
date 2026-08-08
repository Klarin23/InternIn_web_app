import OnboardingStepperWrapper from "@/components/features/onboarding/OnboardingStepperWrapper";

export default function OnboardingLayout({ children }) {
  return (
    <div className="mx-auto max-w-[640px] px-6 py-14">
      <div className="mb-3 text-xl font-extrabold text-foreground">
        Intern<span className="text-primary">In</span>
      </div>
      <OnboardingStepperWrapper />
      <div className="mt-8">{children}</div>
    </div>
  );
}
