export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export interface WizardAnswers {
  // Step 1: Sexual History
  biologicalSex?: string;
  genderIdentity?: string;
  sexualOrientation?: string;
  partnerCountLifetime?: string;
  partnerCountPast12Months?: string;
  partnerGenders?: string[];
  lastSTITest?: string;
  priorSTIs?: string[];
  hivStatus?: string;

  // Step 2: Current Practices
  practiceTypes?: string[];
  condomUse?: string;
  dentalDamUse?: string;
  prepUse?: string;
  partnerDisclosure?: string;
  anonymousEncounters?: string;
  groupSex?: string;
  chemsex?: string;

  // Step 3: Lifestyle Factors
  substanceUse?: string[];
  ivDrugUse?: string;
  needleSharing?: string;
  vaccination?: string[];
  immunocompromised?: string;
  generalHealth?: string;
  regularDoctor?: string;
  symptoms?: string[];

  // Step 4: Recent Incident (optional)
  hasRecentIncident?: string;
  incidentDate?: string;
  incidentType?: string[];
  condomUsed?: string;
  partnerKnownStatus?: string;
  pepConsidered?: string;
  incidentDescription?: string;

  [key: string]: string | string[] | undefined;
}

export interface RiskItem {
  category: string;
  level: RiskLevel;
  headline: string;
  explanation: string;
}

export interface ActionItem {
  priority: 'urgent' | 'recommended' | 'optional';
  action: string;
  reason: string;
  timeframe?: string;
}

export interface RiskAssessment {
  overallLevel: RiskLevel;
  elfNarration: string;
  risks: RiskItem[];
  actions: ActionItem[];
  pepRecommended: boolean;
  urgentCareNeeded: boolean;
  disclaimer: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AppState {
  wizardAnswers: WizardAnswers;
  wizardStep: number;
  wizardComplete: boolean;
  assessment: RiskAssessment | null;
  chatMessages: ChatMessage[];
}
