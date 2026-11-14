export interface FieldOption {
  value: string;
  label: string;
}

export interface WizardField {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'textarea' | 'radio';
  options?: FieldOption[];
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  hint?: string;
}

export interface WizardStep {
  id: number;
  title: string;
  subtitle: string;
  fields: WizardField[];
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 0,
    title: 'Sexual History',
    subtitle: 'A bit about you — all answers stay private and session-only.',
    fields: [
      {
        key: 'biologicalSex',
        label: 'Biological sex',
        type: 'select',
        required: true,
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'intersex', label: 'Intersex' },
          { value: 'prefer_not_to_say', label: 'Prefer not to say' },
        ],
      },
      {
        key: 'genderIdentity',
        label: 'Gender identity',
        type: 'select',
        required: false,
        options: [
          { value: 'man', label: 'Man' },
          { value: 'woman', label: 'Woman' },
          { value: 'non_binary', label: 'Non-binary' },
          { value: 'trans_man', label: 'Trans man' },
          { value: 'trans_woman', label: 'Trans woman' },
          { value: 'prefer_not_to_say', label: 'Prefer not to say' },
        ],
      },
      {
        key: 'sexualOrientation',
        label: 'Sexual orientation',
        type: 'select',
        required: false,
        options: [
          { value: 'heterosexual', label: 'Heterosexual / Straight' },
          { value: 'gay', label: 'Gay' },
          { value: 'lesbian', label: 'Lesbian' },
          { value: 'bisexual', label: 'Bisexual' },
          { value: 'pansexual', label: 'Pansexual' },
          { value: 'queer', label: 'Queer' },
          { value: 'asexual', label: 'Asexual' },
          { value: 'prefer_not_to_say', label: 'Prefer not to say' },
        ],
      },
      {
        key: 'partnerCountPast12Months',
        label: 'Number of sexual partners in the past 12 months',
        type: 'select',
        required: true,
        options: [
          { value: '0', label: '0' },
          { value: '1', label: '1' },
          { value: '2-5', label: '2–5' },
          { value: '6-10', label: '6–10' },
          { value: '10+', label: 'More than 10' },
        ],
      },
      {
        key: 'partnerGenders',
        label: 'Partner gender(s)',
        type: 'multiselect',
        hint: 'Select all that apply',
        options: [
          { value: 'men', label: 'Men' },
          { value: 'women', label: 'Women' },
          { value: 'non_binary', label: 'Non-binary people' },
          { value: 'trans_men', label: 'Trans men' },
          { value: 'trans_women', label: 'Trans women' },
        ],
      },
      {
        key: 'lastSTITest',
        label: 'When did you last get tested for STIs?',
        type: 'select',
        required: true,
        options: [
          { value: 'never', label: 'Never' },
          { value: 'within_3_months', label: 'Within the last 3 months' },
          { value: '3_to_6_months', label: '3–6 months ago' },
          { value: '6_to_12_months', label: '6–12 months ago' },
          { value: 'over_1_year', label: 'Over a year ago' },
        ],
      },
      {
        key: 'priorSTIs',
        label: 'Have you ever been diagnosed with any STIs?',
        type: 'multiselect',
        hint: 'Select all that apply',
        options: [
          { value: 'none', label: 'None' },
          { value: 'chlamydia', label: 'Chlamydia' },
          { value: 'gonorrhoea', label: 'Gonorrhoea' },
          { value: 'syphilis', label: 'Syphilis' },
          { value: 'herpes', label: 'Herpes (HSV-1 or HSV-2)' },
          { value: 'hpv_warts', label: 'Genital warts (HPV)' },
          { value: 'hiv', label: 'HIV' },
          { value: 'trichomonas', label: 'Trichomonas' },
          { value: 'hepatitis', label: 'Hepatitis B or C' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        key: 'hivStatus',
        label: 'HIV status (if known)',
        type: 'select',
        options: [
          { value: 'negative', label: 'HIV negative (recent test)' },
          { value: 'positive_undetectable', label: 'HIV positive, undetectable (U=U)' },
          { value: 'positive_detectable', label: 'HIV positive, detectable or unknown VL' },
          { value: 'unknown', label: 'Unknown / not tested' },
          { value: 'prefer_not_to_say', label: 'Prefer not to say' },
        ],
      },
    ],
  },
  {
    id: 1,
    title: 'Current Practices',
    subtitle: 'What does your sex life typically look like?',
    fields: [
      {
        key: 'practiceTypes',
        label: 'Sexual practices (select all that apply)',
        type: 'multiselect',
        hint: 'This helps us identify which infections are most relevant to you.',
        options: [
          { value: 'vaginal_sex', label: 'Vaginal sex (insertive)' },
          { value: 'vaginal_sex_receptive', label: 'Vaginal sex (receptive)' },
          { value: 'anal_sex_insertive', label: 'Anal sex (insertive)' },
          { value: 'anal_sex_receptive', label: 'Anal sex (receptive)' },
          { value: 'oral_sex_giving', label: 'Oral sex (giving)' },
          { value: 'oral_sex_receiving', label: 'Oral sex (receiving)' },
          { value: 'rimming', label: 'Rimming (oral-anal contact)' },
          { value: 'fingering_handjob', label: 'Manual stimulation (fingering / handjob)' },
          { value: 'sex_toys', label: 'Sex toys (shared)' },
          { value: 'fisting', label: 'Fisting' },
        ],
      },
      {
        key: 'condomUse',
        label: 'How often do you use condoms for penetrative sex?',
        type: 'select',
        required: true,
        options: [
          { value: 'always', label: 'Always' },
          { value: 'usually', label: 'Usually' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'rarely', label: 'Rarely' },
          { value: 'never', label: 'Never' },
          { value: 'na', label: 'Not applicable' },
        ],
      },
      {
        key: 'dentalDamUse',
        label: 'Do you use dental dams / barrier methods for oral sex?',
        type: 'select',
        options: [
          { value: 'always', label: 'Always' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'never', label: 'Never' },
          { value: 'na', label: 'Not applicable' },
        ],
      },
      {
        key: 'prepUse',
        label: 'Are you currently taking PrEP (HIV pre-exposure prophylaxis)?',
        type: 'select',
        options: [
          { value: 'yes_daily', label: 'Yes — daily regimen' },
          { value: 'yes_event', label: 'Yes — event-based (2-1-1)' },
          { value: 'no', label: 'No' },
          { value: 'considering', label: 'No, but considering it' },
        ],
      },
      {
        key: 'partnerDisclosure',
        label: 'Do partners typically disclose their STI / HIV status before sex?',
        type: 'select',
        options: [
          { value: 'always', label: 'Always' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'never', label: 'Never' },
          { value: 'not_applicable', label: 'Long-term monogamous — not applicable' },
        ],
      },
      {
        key: 'anonymousEncounters',
        label: 'Do you have sex with people whose STI status is unknown to you?',
        type: 'select',
        options: [
          { value: 'never', label: 'Never' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'often', label: 'Often' },
        ],
      },
      {
        key: 'groupSex',
        label: 'Do you participate in group sex?',
        type: 'select',
        options: [
          { value: 'never', label: 'Never' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'often', label: 'Often' },
        ],
      },
      {
        key: 'chemsex',
        label: 'Do you use drugs to enhance sexual experiences (chemsex)?',
        type: 'select',
        hint: 'e.g. mephedrone, crystal meth, GHB/GBL',
        options: [
          { value: 'never', label: 'Never' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'often', label: 'Often' },
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'Lifestyle Factors',
    subtitle: 'A few more things that can affect sexual health.',
    fields: [
      {
        key: 'substanceUse',
        label: 'Do you use any recreational substances?',
        type: 'multiselect',
        hint: 'Select all that apply — this affects some STI risks',
        options: [
          { value: 'none', label: 'None' },
          { value: 'alcohol', label: 'Alcohol' },
          { value: 'cannabis', label: 'Cannabis' },
          { value: 'cocaine', label: 'Cocaine / crack' },
          { value: 'mdma', label: 'MDMA / ecstasy' },
          { value: 'mephedrone', label: 'Mephedrone' },
          { value: 'crystal_meth', label: 'Crystal meth' },
          { value: 'ghb', label: 'GHB/GBL' },
          { value: 'poppers', label: 'Poppers (amyl nitrite)' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        key: 'ivDrugUse',
        label: 'Do you use intravenous (injected) drugs?',
        type: 'select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
        ],
      },
      {
        key: 'needleSharing',
        label: 'If yes, do you share needles or equipment?',
        type: 'select',
        options: [
          { value: 'na', label: 'Not applicable' },
          { value: 'no', label: 'No — never share' },
          { value: 'sometimes', label: 'Sometimes' },
          { value: 'yes', label: 'Yes, regularly' },
        ],
      },
      {
        key: 'vaccination',
        label: 'Vaccines received (select all that apply)',
        type: 'multiselect',
        options: [
          { value: 'hpv', label: 'HPV vaccine (Gardasil)' },
          { value: 'hep_a', label: 'Hepatitis A' },
          { value: 'hep_b', label: 'Hepatitis B' },
          { value: 'mpox', label: 'Mpox (monkeypox)' },
          { value: 'none', label: 'None of the above' },
          { value: 'unsure', label: 'Not sure' },
        ],
      },
      {
        key: 'immunocompromised',
        label: 'Are you immunocompromised?',
        type: 'select',
        hint: 'e.g. HIV positive with low CD4, on immunosuppressants, chemotherapy',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Yes' },
          { value: 'unsure', label: 'Not sure' },
        ],
      },
      {
        key: 'generalHealth',
        label: 'How would you describe your general health?',
        type: 'select',
        options: [
          { value: 'excellent', label: 'Excellent' },
          { value: 'good', label: 'Good' },
          { value: 'fair', label: 'Fair' },
          { value: 'poor', label: 'Poor' },
        ],
      },
      {
        key: 'regularDoctor',
        label: 'Are you registered with a GP or sexual health clinic?',
        type: 'select',
        options: [
          { value: 'yes_gp', label: 'Yes — registered with a GP' },
          { value: 'yes_clinic', label: 'Yes — I use a sexual health clinic' },
          { value: 'both', label: 'Both' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        key: 'symptoms',
        label: 'Are you experiencing any current symptoms?',
        type: 'multiselect',
        hint: 'Select all that apply',
        options: [
          { value: 'none', label: 'None' },
          { value: 'discharge_unusual', label: 'Unusual discharge (penis/vagina)' },
          { value: 'sores_ulcers', label: 'Sores, ulcers or blisters on genitals or mouth' },
          { value: 'burning_urination', label: 'Burning or pain when urinating' },
          { value: 'rash', label: 'Rash (including on palms or soles)' },
          { value: 'warts', label: 'Warts or unusual lumps' },
          { value: 'pelvic_pain', label: 'Pelvic or lower abdominal pain' },
          { value: 'swollen_lymph', label: 'Swollen glands' },
          { value: 'anal_symptoms', label: 'Anal discomfort, discharge or bleeding' },
          { value: 'throat_symptoms', label: 'Sore throat (possible after oral sex)' },
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'Recent Incident',
    subtitle: 'Did anything happen recently that you\'re concerned about?',
    fields: [
      {
        key: 'hasRecentIncident',
        label: 'Do you have a specific recent encounter you\'d like assessed?',
        type: 'radio',
        required: true,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No — skip this section' },
        ],
      },
      {
        key: 'incidentDate',
        label: 'When did this happen?',
        type: 'date',
        hint: 'Approximate date is fine',
      },
      {
        key: 'incidentType',
        label: 'What type of sexual contact occurred?',
        type: 'multiselect',
        hint: 'Select all that apply',
        options: [
          { value: 'vaginal_sex', label: 'Vaginal sex' },
          { value: 'anal_sex_insertive', label: 'Anal sex (insertive)' },
          { value: 'anal_sex_receptive', label: 'Anal sex (receptive)' },
          { value: 'oral_sex', label: 'Oral sex' },
          { value: 'rimming', label: 'Rimming' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        key: 'condomUsed',
        label: 'Was a condom used?',
        type: 'select',
        options: [
          { value: 'yes_intact', label: 'Yes — remained intact throughout' },
          { value: 'yes_broke', label: 'Yes — but it broke or slipped' },
          { value: 'no', label: 'No' },
          { value: 'partial', label: 'For part of the encounter only' },
        ],
      },
      {
        key: 'partnerKnownStatus',
        label: 'Do you know the partner\'s HIV/STI status?',
        type: 'select',
        options: [
          { value: 'hiv_negative_tested', label: 'HIV negative — recent test' },
          { value: 'hiv_positive_undetectable', label: 'HIV positive — undetectable (U=U)' },
          { value: 'hiv_positive_unknown_vl', label: 'HIV positive — viral load unknown' },
          { value: 'unknown', label: 'Unknown / anonymous' },
          { value: 'high_risk_group', label: 'Likely higher risk (e.g. injecting drug use, sex work)' },
        ],
      },
      {
        key: 'pepConsidered',
        label: 'Have you considered or started PEP (post-exposure prophylaxis)?',
        type: 'select',
        hint: 'PEP must be started within 72 hours of potential HIV exposure',
        options: [
          { value: 'started', label: 'Yes — already started PEP' },
          { value: 'no_within_72h', label: 'No — but still within 72 hours' },
          { value: 'no_over_72h', label: 'No — more than 72 hours have passed' },
          { value: 'not_applicable', label: 'Not applicable to this incident' },
        ],
      },
      {
        key: 'incidentDescription',
        label: 'Anything else you\'d like Sylvan to know about this incident?',
        type: 'textarea',
        placeholder: 'Optional — any details that might be relevant...',
        maxLength: 500,
      },
    ],
  },
];

export const STEP_TITLES = WIZARD_STEPS.map((s) => s.title);
export const TOTAL_STEPS = WIZARD_STEPS.length;
