import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface TimelineStep {
  step: number;
  event: string;
  timestamp: string;
  txId: string;
  status: "verified" | "pending" | "failed";
}

export interface TrustSignal {
  id: string;
  title: string;
  status: "verified" | "pending" | "failed";
  plainExplanation: string;
  technicalDetail: string;
}

export type GuideStep = 1 | 2 | 3 | 4;

interface VerificationState {
  isGuideActive: boolean;
  currentGuideStep: GuideStep;
  expandedSignal: string | null;
  showEducationalContent: boolean;
  assistantLanguage: "en" | "id";
}

interface VerificationAssistantContextType {
  state: VerificationState;
  toggleGuide: () => void;
  setGuideStep: (step: GuideStep) => void;
  setExpandedSignal: (id: string | null) => void;
  toggleEducationalContent: () => void;
  setAssistantLanguage: (lang: "en" | "id") => void;
  reset: () => void;
}

const defaultState: VerificationState = {
  isGuideActive: false,
  currentGuideStep: 1,
  expandedSignal: null,
  showEducationalContent: true,
  assistantLanguage: "en",
};

const VerificationAssistantContext = createContext<VerificationAssistantContextType | null>(null);

export function VerificationAssistantProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VerificationState>(defaultState);

  const toggleGuide = useCallback(
    () => setState((prev) => ({ ...prev, isGuideActive: !prev.isGuideActive })),
    [],
  );

  const setGuideStep = useCallback(
    (step: GuideStep) => setState((prev) => ({ ...prev, currentGuideStep: step })),
    [],
  );

  const setExpandedSignal = useCallback(
    (id: string | null) => setState((prev) => ({ ...prev, expandedSignal: id })),
    [],
  );

  const toggleEducationalContent = useCallback(
    () => setState((prev) => ({ ...prev, showEducationalContent: !prev.showEducationalContent })),
    [],
  );

  const setAssistantLanguage = useCallback(
    (lang: "en" | "id") => setState((prev) => ({ ...prev, assistantLanguage: lang })),
    [],
  );

  const reset = useCallback(() => setState(defaultState), []);

  const value = {
    state,
    toggleGuide,
    setGuideStep,
    setExpandedSignal,
    toggleEducationalContent,
    setAssistantLanguage,
    reset,
  };

  return (
    <VerificationAssistantContext.Provider value={value}>
      {children}
    </VerificationAssistantContext.Provider>
  );
}

export function useVerificationAssistant() {
  const ctx = useContext(VerificationAssistantContext);
  if (!ctx) throw new Error("useVerificationAssistant must be used within VerificationAssistantProvider");
  return ctx;
}
