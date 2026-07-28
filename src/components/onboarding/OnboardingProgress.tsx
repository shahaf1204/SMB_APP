import './onboarding.css';

export function OnboardingProgress({ step, total = 5 }: { step: number; total?: number }) {
  return (
    <div className="onboarding-progress" role="status" aria-live="polite">
      <span className="onboarding-progress__label">
        {step} מתוך {total}
      </span>
      <div className="onboarding-progress__track" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`onboarding-progress__dot ${i < step ? 'onboarding-progress__dot--done' : ''} ${i + 1 === step ? 'onboarding-progress__dot--current' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
