import React, { useEffect, useMemo, useRef, useState } from "react";

const BASE = import.meta.env.BASE_URL;
function fig(name: string) { return `${BASE}figures/${name}`; }

function Ref({ id }: { id: string }) {
  return <sup className="text-[9px] text-indigo-500 font-medium ml-px">[{id}]</sup>;
}

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "how", label: "How it works" },
  { id: "demo", label: "Offline Demo" },
  { id: "results", label: "Results" },
  { id: "safety", label: "Safety" },
  { id: "team", label: "Team" },
] as const;

type NavId = (typeof NAV)[number]["id"];

type DemoCase = {
  id: string;
  title: string;
  tags: string[];
  profile: Record<string, any>;
  evidence: {
    guidelines: string[];
    tools: string[];
    retrieved_points: string[];
  };
  output_adime: Record<string, any>;
  safety_constraints: Array<{ rule: string; examples: string[]; note: string }>;
  fhir_nutrition_order: Record<string, any>;
};

const DEMO_CASES: DemoCase[] = [
  {
    id: "case-1",
    title: "Case A: Post-stroke + HTN + T2D (Warfarin)",
    tags: ["Stroke", "Hypertension", "Diabetes", "Warfarin"],
    profile: {
      demographics: { age: 67, sex: "M" },
      anthropometrics: { bmi: 31.4 },
      biomarkers: { sbp: 156, glucose: 182, hba1c: 8.1, cholesterol: 224 },
      meds: ["Warfarin"],
      diet_history: {
        pattern: "High sodium, low fiber",
        typical_day: ["fast food breakfast", "sweetened beverage", "salty snacks"],
      },
      notes: "Reports low activity; wants simple swaps.",
    },
    evidence: {
      guidelines: ["DASH", "ADA"],
      tools: ["DailyMed"],
      retrieved_points: [
        "DASH: sodium reduction and potassium-forward foods",
        "ADA: reduce added sugar, emphasize fiber and controlled carbs",
        "DailyMed: Warfarin—avoid large swings in Vitamin K intake",
      ],
    },
    output_adime: {
      A: {
        summary:
          "Elevated SBP and HbA1c with obesity; diet pattern suggests excess sodium and added sugars, low fiber.",
        key_metrics: {
          SBP: "156 mmHg (high)",
          HbA1c: "8.1% (high)",
          BMI: "31.4 (obese)",
        },
      },
      D: {
        problems: [
          {
            name: "Excessive sodium intake",
            score: { severity: 0.78, urgency: 0.62, modifiability: 0.75 },
          },
          {
            name: "Excess added sugars / poor glycemic control",
            score: { severity: 0.74, urgency: 0.66, modifiability: 0.7 },
          },
          {
            name: "Low fiber intake",
            score: { severity: 0.55, urgency: 0.4, modifiability: 0.82 },
          },
        ],
      },
      I: {
        directives: [
          {
            action: "Replace",
            food: "Sweetened soda → sparkling water / unsweetened tea",
            reason: "Reduce added sugar to support HbA1c control.",
          },
          {
            action: "Replace",
            food: "Processed deli meats → baked chicken/turkey (low-sodium)",
            reason: "Lower sodium per DASH; support BP.",
          },
          {
            action: "Add",
            food: "Oats + chia (breakfast)",
            reason: "Increase soluble fiber to improve glycemic response.",
          },
          {
            action: "Continue",
            food: "Consistent small servings of greens (avoid large sudden increases)",
            reason:
              "Warfarin safety: keep Vitamin K intake consistent rather than fluctuating.",
          },
        ],
      },
      M: {
        monitoring: [
          "Track home BP 3–4x/week; note salt-heavy meals",
          "Track fasting glucose; limit sugary drinks and desserts",
          "Ask clinician about INR stability if changing leafy green intake",
        ],
        evaluation: [
          "Goal: SBP down by ~10 mmHg in 8–12 weeks",
          "Goal: reduce sugary beverages to ≤1/week",
          "Goal: +10–15g/day fiber via oats/beans/berries",
        ],
      },
    },
    safety_constraints: [
      {
        rule: "Warfarin: avoid large, abrupt increases in Vitamin K-rich foods",
        examples: ["kale", "spinach", "collard greens"],
        note: "Consistency is key; coordinate changes with clinician.",
      },
    ],
    fhir_nutrition_order: {
      resourceType: "NutritionOrder",
      status: "active",
      intent: "plan",
      patient: { reference: "Patient/demo-A" },
      dateTime: "2026-02-19T00:00:00Z",
      oralDiet: {
        type: [{ text: "DASH + ADA-aligned" }],
        schedule: [{ text: "3 meals/day" }],
        nutrient: [
          { modifier: "sodium", amount: { value: 1500, unit: "mg/day" } },
          { modifier: "addedSugar", amount: { value: 25, unit: "g/day" } },
          { modifier: "fiber", amount: { value: 30, unit: "g/day" } },
        ],
      },
      note: [
        {
          text:
            "Demo only. Not medical advice. Warfarin: keep Vitamin K intake consistent; review with clinician.",
        },
      ],
    },
  },
  {
    id: "case-2",
    title: "Case B: CKD risk + HTN (Potassium-sparing diuretic)",
    tags: ["Hypertension", "CKD risk", "K-sparing diuretic"],
    profile: {
      demographics: { age: 59, sex: "F" },
      anthropometrics: { bmi: 28.2 },
      biomarkers: { sbp: 148, glucose: 112, hba1c: 6.0, cholesterol: 198 },
      meds: ["Spironolactone"],
      diet_history: {
        pattern: "High potassium foods daily; salty soups",
        typical_day: ["banana smoothie", "instant noodles", "chips"],
      },
      notes: "Wants quick meals; limited cooking.",
    },
    evidence: {
      guidelines: ["DASH"],
      tools: ["DailyMed"],
      retrieved_points: [
        "DASH: sodium reduction",
        "DailyMed: hyperkalemia risk with potassium-sparing diuretics",
      ],
    },
    output_adime: {
      A: {
        summary:
          "Hypertension with borderline glucose; diet includes sodium-heavy convenience foods and potassium-rich smoothies.",
        key_metrics: { SBP: "148 mmHg (high)", BMI: "28.2 (overweight)" },
      },
      D: {
        problems: [
          {
            name: "Excess sodium intake",
            score: { severity: 0.72, urgency: 0.6, modifiability: 0.8 },
          },
          {
            name: "Hyperkalemia risk due to medication + diet",
            score: { severity: 0.7, urgency: 0.7, modifiability: 0.55 },
          },
        ],
      },
      I: {
        directives: [
          {
            action: "Replace",
            food: "Instant noodles → low-sodium soup + lean protein",
            reason: "Reduce sodium for BP control.",
          },
          {
            action: "Replace",
            food: "Banana smoothie → berries + yogurt (lower potassium)",
            reason: "Medication safety: reduce potassium load.",
          },
          {
            action: "Add",
            food: "Frozen veggie mix (lower-potassium options) + olive oil",
            reason: "Convenient meals while staying guideline-aligned.",
          },
        ],
      },
      M: {
        monitoring: [
          "Monitor BP weekly",
          "Ask clinician for potassium labs if diet changes",
          "Track high-potassium foods (banana, orange juice, certain greens)",
        ],
        evaluation: [
          "Goal: sodium ≤ 1500–2000 mg/day",
          "Goal: avoid frequent high-potassium smoothies while on spironolactone",
        ],
      },
    },
    safety_constraints: [
      {
        rule: "Potassium-sparing diuretic: limit high-potassium foods",
        examples: ["banana", "orange juice", "salt substitutes with potassium"],
        note: "Check with clinician; individual needs vary.",
      },
    ],
    fhir_nutrition_order: {
      resourceType: "NutritionOrder",
      status: "active",
      intent: "plan",
      patient: { reference: "Patient/demo-B" },
      dateTime: "2026-02-19T00:00:00Z",
      oralDiet: {
        type: [{ text: "Low-sodium, potassium-aware" }],
        nutrient: [
          { modifier: "sodium", amount: { value: 1800, unit: "mg/day" } },
          { modifier: "potassium", amount: { value: 2000, unit: "mg/day" } },
        ],
      },
      note: [
        {
          text:
            "Demo only. Not medical advice. Potassium monitoring is recommended with potassium-sparing diuretics.",
        },
      ],
    },
  },
  {
    id: "case-3",
    title: "Case C: Hyperlipidemia + Prediabetes (Lifestyle focus)",
    tags: ["Prediabetes", "Cholesterol"],
    profile: {
      demographics: { age: 44, sex: "M" },
      anthropometrics: { bmi: 26.5 },
      biomarkers: { sbp: 126, glucose: 105, hba1c: 5.8, cholesterol: 238 },
      meds: ["Atorvastatin"],
      diet_history: {
        pattern: "Frequent fried foods; low veggies",
        typical_day: ["fried lunch", "late-night snacks"],
      },
      notes: "Open to meal prep on weekends.",
    },
    evidence: {
      guidelines: ["USDA general", "ADA (prevention)"],
      tools: ["DailyMed"],
      retrieved_points: [
        "Increase fiber and unsaturated fats",
        "Reduce saturated fat and sugary snacks",
      ],
    },
    output_adime: {
      A: {
        summary:
          "Prediabetes and elevated cholesterol with moderate overweight; dietary pattern high in fried foods.",
        key_metrics: {
          HbA1c: "5.8% (prediabetes)",
          Cholesterol: "238 mg/dL (high)",
        },
      },
      D: {
        problems: [
          {
            name: "High saturated fat intake",
            score: { severity: 0.68, urgency: 0.5, modifiability: 0.78 },
          },
          {
            name: "High refined snack intake",
            score: { severity: 0.55, urgency: 0.45, modifiability: 0.72 },
          },
        ],
      },
      I: {
        directives: [
          {
            action: "Replace",
            food: "Fried lunch → grilled bowl (beans + veggies + brown rice)",
            reason: "Improve lipid profile; add fiber.",
          },
          {
            action: "Add",
            food: "Nuts (small portion) + fruit as snack",
            reason: "Reduce refined snacks; support satiety.",
          },
          {
            action: "Continue",
            food: "Weekend meal prep habit",
            reason: "Supports adherence and consistency.",
          },
        ],
      },
      M: {
        monitoring: ["Track snack frequency", "Repeat lipids in 3–6 months"],
        evaluation: ["Goal: reduce fried meals to ≤1/week"],
      },
    },
    safety_constraints: [
      {
        rule: "Statin: avoid grapefruit if contraindicated",
        examples: ["grapefruit", "grapefruit juice"],
        note: "Label-dependent; confirm with clinician/pharmacist.",
      },
    ],
    fhir_nutrition_order: {
      resourceType: "NutritionOrder",
      status: "active",
      intent: "plan",
      patient: { reference: "Patient/demo-C" },
      dateTime: "2026-02-19T00:00:00Z",
      oralDiet: {
        type: [{ text: "Heart-healthy, fiber-forward" }],
        nutrient: [
          { modifier: "saturatedFat", amount: { value: 18, unit: "g/day" } },
          { modifier: "fiber", amount: { value: 28, unit: "g/day" } },
        ],
      },
    },
  },
];

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 shadow-sm">
      {children}
    </span>
  );
}

function MathTip({ children, tip }: { children: React.ReactNode; tip: string }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<"top" | "bottom">("top");
  const ref = useRef<HTMLSpanElement>(null);

  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos(rect.top < 100 ? "bottom" : "top");
    }
    setShow(true);
  };

  return (
    <span
      ref={ref}
      className="relative inline-flex cursor-help"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
    >
      <span className="font-mono text-xs bg-indigo-50 border border-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded transition-colors hover:bg-indigo-100 hover:border-indigo-300">
        {children}
      </span>
      {show && (
        <span
          className={classNames(
            "absolute left-1/2 -translate-x-1/2 z-50 w-56 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg leading-relaxed pointer-events-none",
            pos === "top" ? "bottom-full mb-2" : "top-full mt-2"
          )}
        >
          <span className={classNames(
            "absolute left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 border-slate-200 bg-white",
            pos === "top" ? "top-full -mt-1 border-b border-r" : "bottom-full -mb-1 border-t border-l"
          )} />
          {tip}
        </span>
      )}
    </span>
  );
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: NavId;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-600 max-w-3xl">{subtitle}</p>
        ) : null}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">{children}</div>
    </section>
  );
}

function CodeBlock({ title, data }: { title: string; data: any }) {
  const content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white">
        <div className="text-sm font-medium text-slate-800">{title}</div>
        <div className="text-xs text-slate-500">Offline snapshot</div>
      </div>
      <pre className="text-xs leading-5 text-slate-800 p-4 overflow-auto max-h-[360px]">{content}</pre>
    </div>
  );
}

function ArchitectureFigure() {
  const [missing, setMissing] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[75%] overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="p-4">
        {!missing ? (
          <img
            src={fig("NutriOrion_case.png")}
            alt="The Healthy Food Trap: A stroke patient on Warfarin asks for a healthy lunch. Generic AI suggests spinach kale salad, but high Vitamin K blocks Warfarin function, increasing clot risk."
            className="w-full h-auto rounded-xl border border-slate-200 bg-white"
            loading="lazy"
            onError={() => setMissing(true)}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-700">
            <div className="font-semibold">Image not found</div>
            <div className="mt-1 text-xs text-slate-600">
              Put this file into <span className="font-mono">public/figures/</span>:
            </div>
            <ul className="mt-2 list-disc pl-5 text-xs text-slate-600 space-y-1">
              <li>
                <span className="font-mono">NutriOrion_case.png</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}


// -----------------
// Dev-only "tests"
// -----------------
function assert(condition: any, message: string) {
  if (!condition) throw new Error(message);
}

function runInvariants() {
  // Test 1: NAV ids unique
  const navIds = NAV.map((n) => n.id);
  assert(new Set(navIds).size === navIds.length, "NAV contains duplicate ids.");

  // Test 2: DEMO_CASES ids unique
  const caseIds = DEMO_CASES.map((c) => c.id);
  assert(new Set(caseIds).size === caseIds.length, "DEMO_CASES contains duplicate ids.");

  // Test 3: Each case has required minimal fields
  for (const c of DEMO_CASES) {
    assert(!!c.title, `Case ${c.id} missing title`);
    assert(!!c.profile, `Case ${c.id} missing profile`);
    assert(!!c.output_adime, `Case ${c.id} missing output_adime`);
    assert(!!c.fhir_nutrition_order, `Case ${c.id} missing fhir_nutrition_order`);
    assert(
      Array.isArray(c.safety_constraints),
      `Case ${c.id} safety_constraints must be an array`
    );
  }

  // Test 4: Ensure results strings are not accidentally truncated
  const expectedPhrases = ["Actionability", "RD-rated quality", "DNI violations"];
  for (const p of expectedPhrases) {
    assert(typeof p === "string" && p.length > 0, "Unexpected empty results phrase.");
  }
}

export default function NutriOrionDemoPrototype() {
  const [activeNav, setActiveNav] = useState<NavId>("overview");
  const [selectedCaseId, setSelectedCaseId] = useState(DEMO_CASES[0].id);
  const [view, setView] = useState<"adime" | "fhir" | "safety">("adime");

  useEffect(() => {
    const isDev = !import.meta.env.PROD;
    if (isDev) runInvariants();
  }, []);

  const selectedCase = useMemo(
    () => DEMO_CASES.find((c) => c.id === selectedCaseId) || DEMO_CASES[0],
    [selectedCaseId]
  );

  const disclaimer =
    "This site is a research demo. All outputs shown are offline examples (no live model). Not medical advice.";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-slate-50 grid place-items-center shadow-sm">
              <span className="text-sm font-semibold">NO</span>
            </div>
            <div>
              <div className="text-sm font-semibold leading-5">NutriOrion</div>
              <div className="text-xs text-slate-500">Offline Demonstration Prototype</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {NAV.map((it) => (
              <button
                key={it.id}
                onClick={() => {
                  setActiveNav(it.id);
                  const el = document.getElementById(it.id);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={classNames(
                  "px-3 py-1.5 rounded-xl text-sm border",
                  activeNav === it.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {it.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#demo"
              className="px-3 py-1.5 rounded-xl text-sm border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              View demo
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert(
                  "Prototype tip: connect this button to your PDF, GitHub, or a video demo in the real site."
                );
              }}
              className="px-3 py-1.5 rounded-xl text-sm border border-slate-900 bg-slate-900 text-white hover:opacity-90"
            >
              Add paper / video
            </a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm">
            <span className="font-medium">Offline only</span>
            <span className="text-slate-400">•</span>
            <span>No live model calls</span>
          </div>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight flex items-center gap-3 flex-wrap">
          <span>NutriOrion: A Hierarchical Multi-Agent Framework for Personalized Nutrition Intervention Grounded in Clinical Guidelines</span>
          <img src={fig("emory-logo.png")} alt="Emory University" className="h-7 w-auto object-contain opacity-80" />
        </h1>

        <div className="mt-5 flex flex-wrap gap-2">
          <Pill>Hierarchical multi-agent</Pill>
          <Pill>Guideline-grounded</Pill>
          <Pill>Safety constraints</Pill>
          <Pill>ADIME → FHIR output</Pill>
        </div>

      </div>

      {/* Full-width storytelling figure */}
      <div className="w-full px-4 pb-8">
        <div className="mx-auto max-w-6xl">
          <ArchitectureFigure />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-6">
          <Section
            id="overview"
            title="What is NutriOrion?"
            subtitle="Turning complex, high-dimensional patient data into safe, actionable nutrition plans — automatically."
          >
            <div className="space-y-5">
              <div className="text-sm text-slate-700 leading-relaxed max-w-4xl">
                A hierarchical multi-agent framework that generates clinically valid, personalized nutrition plans
                grounded in evidence-based guidelines. NutriOrion handles conflicting dietary requirements across
                multiple conditions while enforcing medication safety constraints, producing structured
                ADIME <Ref id="39" /> outputs and FHIR-ready resources for seamless EHR integration.
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">The Stakes</div>
                  <div className="mt-2 text-sm text-slate-700">
                    Chronic diseases cause <span className="font-semibold text-slate-900">70% of global mortality</span> <Ref id="12" />.
                    Structured nutrition can match pharmacological treatments in effectiveness <Ref id="14,17" /> — yet
                    <span className="font-semibold text-slate-900"> 40% of patients</span> have multiple co-occurring conditions
                    that demand conflicting diets <Ref id="10,35" />. With only <span className="font-semibold text-slate-900">1 nutrition professional
                    per 5,000 patients</span> <Ref id="18,38" />, manual integration is impossible at scale.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Why Current AI Fails</div>
                  <div className="mt-2 text-sm text-slate-700">
                    Single-agent LLMs process all patient data through one context window.
                    As complexity grows, they suffer from <span className="font-semibold text-slate-900">reasoning collapse</span> <Ref id="24,31" />:
                    safety constraints get overridden, drug–nutrient interactions are missed,
                    and recommendations contradict patient data <Ref id="5,34" />. A "healthy" suggestion can become
                    a <span className="font-semibold text-slate-900">dangerous one</span>.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">The Key Insight</div>
                  <div className="mt-2 text-sm text-slate-700">
                    Clinical teams don't work as a single brain — they <span className="font-semibold text-slate-900">divide and conquer</span> <Ref id="7" />.
                    Each specialist assesses independently, then they synthesize together. NutriOrion mirrors
                    this: <span className="font-semibold text-slate-900">decompose, isolate, then synthesize under safety constraints</span>.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">How NutriOrion Works</div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <div className="text-sm font-semibold text-slate-900">1. Retrieve</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Ground every decision in clinical guidelines (DASH <Ref id="11" />, ADA <Ref id="2" />) and real drug labels (DailyMed <Ref id="43" />) via RAG <Ref id="15,22" /> — not memorized knowledge.
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <div className="text-sm font-semibold text-slate-900">2. Assess in Parallel</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Specialized agents (Body, Clinical, Medication, Diet) analyze independently with isolated contexts, preventing cross-domain bias and anchoring <Ref id="24" />.
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <div className="text-sm font-semibold text-slate-900">3. Refine & Prioritize</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Condition-specific dietitians resolve conflicts via Severity–Urgency–Modifiability scoring, while safety constraints are injected as hard negatives <Ref id="8" />.
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <div className="text-sm font-semibold text-slate-900">4. Output</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Structured ADIME <Ref id="39" /> clinical notes + FHIR R4 NutritionOrder — ready for direct EHR integration.
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">330</div>
                  <div className="mt-1 text-xs text-slate-600">Multimorbid stroke patients (NHANES <Ref id="19" />)</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">97.8%</div>
                  <div className="mt-1 text-xs text-slate-600">Actionable recommendations (concrete food swaps)</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">7.5 / 8</div>
                  <div className="mt-1 text-xs text-slate-600">Expert dietitian quality rating (NCP-QUEST <Ref id="23" />)</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">+167%</div>
                  <div className="mt-1 text-xs text-slate-600">Fiber improvement over patient baseline</div>
                </div>
              </div>
            </div>
          </Section>

          <Section
            id="how"
            title="Methodology"
            subtitle="NutriOrion decomposes personalized nutrition as a structured inference task: F : X → Y, mapping multi-modal patient state to a clinically valid action plan."
          >
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-semibold text-slate-900">Problem Formulation</div>
                <div className="mt-3 text-sm text-slate-700">
                  <p>
                    For each patient <MathTip tip="A single patient from the population P. Each patient has a unique composite clinical profile.">p ∈ P</MathTip>, the input state is a composite vector of clinical features:
                  </p>
                  <div className="my-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-center text-slate-800 flex items-center justify-center gap-1 flex-wrap">
                    <MathTip tip="The full patient state vector — all clinical data the system needs to generate a nutrition plan.">X<sub>p</sub></MathTip>
                    <span className="font-mono">=</span>
                    <span className="font-mono">[</span>
                    <MathTip tip="Anthropometrics: body measurements like BMI, weight, height.">A<sub>p</sub></MathTip><span className="font-mono">,</span>
                    <MathTip tip="Biomarkers: lab results such as HbA1c, blood pressure, cholesterol, fasting glucose.">B<sub>p</sub></MathTip><span className="font-mono">,</span>
                    <MathTip tip="Medication profile: all current drugs (e.g. Warfarin, Spironolactone) — critical for safety checking.">M<sub>p</sub></MathTip><span className="font-mono">,</span>
                    <MathTip tip="Dietary history: what the patient actually eats (24h recall), including patterns and typical meals.">D<sub>p</sub></MathTip><span className="font-mono">,</span>
                    <MathTip tip="Sociodemographic factors: age, sex, lifestyle context, cooking ability, preferences.">S<sub>p</sub></MathTip>
                    <span className="font-mono">]</span>
                  </div>
                  <p className="mt-2">
                    The objective is to learn a mapping{" "}
                    <MathTip tip="The full NutriOrion pipeline: Retrieval (R) fetches evidence, Hierarchical reasoning (H) processes it through multi-agent stages, Output (O) standardizes the result. K = knowledge base, Θ = fixed LLM parameters (T=0).">F(X<sub>p</sub>; K, Θ) = O ∘ H(X<sub>p</sub>, R(X<sub>p</sub>, K))</MathTip>{" "}
                    that produces output{" "}
                    <MathTip tip="The final personalized nutrition plan — structured as an ADIME clinical note with actionable food-level directives.">Y<sub>p</sub></MathTip>{" "}
                    strictly adhering to the ADIME clinical standard.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">R</span>
                    <div className="text-sm font-semibold text-slate-900">Retrieval-Augmented Grounding</div>
                  </div>
                  <div className="mt-3 text-sm text-slate-700">
                    <p>Dual-source retrieval system <MathTip tip="The retrieval function: takes agent query q and returns the most relevant evidence chunks from the knowledge base.">R(q)</MathTip> maps agent queries to evidence contexts:</p>
                    <ul className="mt-2 space-y-2 text-xs">
                      <li>
                        <span className="font-semibold text-slate-900">Guideline Manifold:</span>{" "}
                        Clinical guidelines (DASH, ADA, USDA) are chunked, embedded via <MathTip tip="BGE-M3: a multilingual embedding model used to convert guideline text into vector representations for semantic search.">BGE-M3</MathTip>, and retrieved by cosine similarity with <MathTip tip="Top-k retrieval: the 3 most relevant guideline chunks are returned per query, balancing context window limits with evidence sufficiency.">k = 3</MathTip>.
                      </li>
                      <li>
                        <span className="font-semibold text-slate-900">Structured Tool Retrieval:</span>{" "}
                        Medication agent queries <MathTip tip="DailyMed/openFDA: FDA's drug label databases. The system extracts food interaction sections from Structured Product Labels (SPLs).">DailyMed/openFDA</MathTip> for drug-nutrient interaction sections from Structured Product Labels.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">H</span>
                    <div className="text-sm font-semibold text-slate-900">Hierarchical Agent Reasoning</div>
                  </div>
                  <div className="mt-3 text-sm text-slate-700 space-y-3">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <div className="text-xs font-semibold text-slate-800">Stage 1 — Parallel Assessment</div>
                      <div className="mt-1 text-xs text-slate-600">
                        Domain agents <MathTip tip="Four specialized agents — Body, Clinical, Medication, Diet — each with its own isolated context window and role prompt. They run in parallel to prevent one domain's findings from biasing another.">A<sub>domain</sub></MathTip> process isolated subspaces of <MathTip tip="The patient state vector. Each agent only sees the slice relevant to its expertise.">X<sub>p</sub></MathTip> concurrently.
                        Independence prevents anchoring bias and cross-domain hallucination.
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <div className="text-xs font-semibold text-slate-800">Stage 2 — Sequential Refinement</div>
                      <div className="mt-1 text-xs text-slate-600">
                        Condition-specific dietitians <MathTip tip="Refinement agents that translate Stage 1 diagnoses into concrete dietary adjustments. E.g., a Diabetes Dietitian activates ADA carb-counting rules only if diabetes is confirmed.">A<sub>refine</sub></MathTip> use Stage 1 diagnoses as conditional constraints.
                        E.g., confirmed hypertension activates DASH-specific sodium limits.
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <div className="text-xs font-semibold text-slate-800">Stage 3 — Synthesis & Safety</div>
                      <div className="mt-1 text-xs text-slate-600">
                        Health Prioritization Agent scores each issue via multi-objective function, 
                        then safety constraints <MathTip tip="The set of drug-nutrient interactions (DNIs) extracted by the Medication Agent. These are injected as hard negative constraints — the plan must NOT contain any foods that violate these rules.">C<sub>safe</sub></MathTip> are injected as hard negatives during generation.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">O</span>
                    <div className="text-sm font-semibold text-slate-900">Output Standardization</div>
                  </div>
                  <div className="mt-3 text-sm text-slate-700 space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">ADIME Projection</div>
                      <div className="mt-1 text-xs text-slate-600">
                        Interventions are structured as discrete actionable directives:
                      </div>
                      <div className="mt-1 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-center text-slate-700 flex items-center justify-center gap-1 flex-wrap">
                        <MathTip tip="The intervention plan: a set of concrete food-level directives. Each has an action type, a specific food item, and a clinical reason.">I<sub>plan</sub></MathTip>
                        <span className="font-mono">= {"{"} (action, food, reason) | action ∈ {"{"}Continue, Replace, Add{"}"} {"}"}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">FHIR R4 Mapping</div>
                      <div className="mt-1 text-xs text-slate-600">
                        A deterministic mapping <MathTip tip="Φ maps the finalized ADIME plan into HL7 FHIR R4 NutritionOrder resources — the international standard for electronic health records. This makes NutriOrion output directly importable into hospital systems.">Φ : Y<sub>p</sub> → Y<sub>FHIR</sub></MathTip> transforms ADIME components into HL7 FHIR R4 NutritionOrder resources for seamless EHR integration.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-sm font-semibold text-slate-900">Priority Scoring Mechanism</div>
                  <div className="mt-3 text-sm text-slate-700">
                    <p>To resolve conflicting guidelines across comorbidities, each health issue <MathTip tip="A single identified health issue, e.g. 'Excessive sodium intake' or 'Hyperkalemia risk'. The system may identify multiple issues per patient.">j</MathTip> is scored by:</p>
                    <div className="my-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-center text-slate-800 flex items-center justify-center gap-1 flex-wrap">
                      <MathTip tip="The composite priority score for issue j. Higher S(j) means this issue should be addressed first in the nutrition plan.">S(j)</MathTip>
                      <span className="font-mono">=</span>
                      <MathTip tip="Severity weight × severity score: how dangerous is this condition? E.g., HbA1c of 8.1 → high severity for glycemic control.">w<sub>sev</sub> · σ<sub>sev</sub>(j)</MathTip>
                      <span className="font-mono">+</span>
                      <MathTip tip="Urgency weight × urgency score: how time-critical? E.g., active drug-nutrient interaction risk → high urgency.">w<sub>urg</sub> · σ<sub>urg</sub>(j)</MathTip>
                      <span className="font-mono">+</span>
                      <MathTip tip="Modifiability weight × modifiability score: how much can diet actually help? E.g., sodium reduction is highly modifiable; genetic conditions are not.">w<sub>mod</sub> · σ<sub>mod</sub>(j)</MathTip>
                    </div>
                    <p className="text-xs text-slate-500">
                      where σ ∈ [0, 1] are normalized scores for <strong>Severity</strong> (how dangerous), <strong>Urgency</strong> (how time-critical), and <strong>Modifiability</strong> (how responsive to dietary change). Issues are ranked by S(j) to determine intervention priority.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-sm font-semibold text-slate-900">Safety Constraint Mechanism</div>
                  <div className="mt-3 text-sm text-slate-700">
                    <p>
                      Drug-nutrient interactions <MathTip tip="The set of all drug-nutrient interactions identified from DailyMed. E.g., for Warfarin: 'avoid large increases in Vitamin K-rich foods (kale, spinach)'.">C<sub>safe</sub></MathTip> identified by the Medication Agent are treated as <strong>hard negative constraints</strong> during final synthesis — not post-hoc filters:
                    </p>
                    <div className="my-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-center text-slate-800 flex items-center justify-center gap-1 flex-wrap">
                      <MathTip tip="For every drug-nutrient interaction d in the safety constraint set: the similarity between the generated plan and the contraindicated action must be below threshold ε. In practice, the plan must not recommend foods that violate any known drug interaction.">∀d ∈ C<sub>safe</sub>, Sim(Y<sub>p</sub>, d<sub>contra</sub>) {"<"} ε</MathTip>
                    </div>
                    <p className="text-xs text-slate-500">
                      This guarantees that the generated plan is pharmacologically valid <strong>by construction</strong>, avoiding the plan incoherence that arises from post-hoc filtering.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section
            id="demo"
            title="Case Studies"
            subtitle="Select a patient case to explore NutriOrion's full pipeline — from input profile to structured clinical output."
          >
            <div className="space-y-5">
              {/* Case selector */}
              <div className="flex flex-wrap gap-2">
                {DEMO_CASES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCaseId(c.id);
                      setView("adime");
                    }}
                    className={classNames(
                      "rounded-xl border px-4 py-2.5 text-left transition-all",
                      selectedCaseId === c.id
                        ? "border-slate-900 bg-slate-900 text-white shadow-md"
                        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300"
                    )}
                  >
                    <div className="text-sm font-medium">{c.title}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className={classNames(
                            "text-[10px] rounded-full px-2 py-0.5 border",
                            selectedCaseId === c.id
                              ? "border-white/20 bg-white/10 text-white/90"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          )}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              {/* Patient profile + Evidence */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient Input</div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                      <div className="text-lg font-bold text-slate-900">{selectedCase.profile.demographics.age}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Age</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                      <div className="text-lg font-bold text-slate-900">{selectedCase.profile.demographics.sex}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Sex</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                      <div className="text-lg font-bold text-slate-900">{selectedCase.profile.anthropometrics.bmi}</div>
                      <div className="text-[10px] text-slate-500 uppercase">BMI</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-slate-500 font-medium">Biomarkers</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedCase.profile.biomarkers).map(([k, v]) => (
                        <span key={k} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-100 px-2 py-1 text-xs">
                          <span className="font-medium text-slate-700 uppercase">{k}</span>
                          <span className="text-slate-900 font-semibold">{String(v)}</span>
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-2">Medications</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCase.profile.meds.map((m: string) => (
                        <span key={m} className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-medium text-red-700">{m}</span>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-2">Diet Pattern</div>
                    <div className="text-xs text-slate-700">{selectedCase.profile.diet_history.pattern}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Retrieved Evidence</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedCase.evidence.guidelines.map((g) => (
                      <span key={g} className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-700">{g}</span>
                    ))}
                    {selectedCase.evidence.tools.map((t) => (
                      <span key={t} className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700">{t}</span>
                    ))}
                  </div>
                  <div className="mt-3 space-y-2">
                    {selectedCase.evidence.retrieved_points.map((p, idx) => (
                      <div key={idx} className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-600">{idx + 1}</span>
                        <span className="text-xs text-slate-700">{p}</span>
                      </div>
                    ))}
                  </div>

                  {/* Safety constraints inline */}
                  <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3">
                    <div className="text-xs font-semibold text-red-800">Hard Safety Constraints</div>
                    {selectedCase.safety_constraints.map((s, idx) => (
                      <div key={idx} className="mt-2">
                        <div className="text-xs text-red-700 font-medium">{s.rule}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {s.examples.map((e) => (
                            <span key={e} className="rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-[10px] text-red-700">{e}</span>
                          ))}
                        </div>
                        <div className="mt-1 text-[10px] text-red-600 italic">{s.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* View tabs */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-fit">
                {(["adime", "fhir", "safety"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={classNames(
                      "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                      view === v
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {v === "adime" ? "ADIME Output" : v === "fhir" ? "FHIR R4" : "Raw JSON"}
                  </button>
                ))}
              </div>

              {/* ADIME visual view */}
              {view === "adime" ? (
                <div className="space-y-4">
                  {/* Assessment */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">A</span>
                      <div className="text-sm font-semibold text-slate-900">Assessment</div>
                    </div>
                    <div className="mt-3 text-sm text-slate-700">{selectedCase.output_adime.A.summary}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(selectedCase.output_adime.A.key_metrics).map(([k, v]) => (
                        <span key={k} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-3 py-1.5 text-xs">
                          <span className="font-medium text-blue-800">{k}</span>
                          <span className="text-blue-600">{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-700">D</span>
                      <div className="text-sm font-semibold text-slate-900">Diagnosis — Identified Dietary Concerns</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Issues are ranked by the system's internal prioritization to guide intervention ordering, not as clinical severity judgments.
                    </div>
                    <div className="mt-3 space-y-2">
                      {selectedCase.output_adime.D.problems.map((p: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                          <span className={classNames(
                            "shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                            idx === 0 ? "bg-amber-200 text-amber-800" : "bg-slate-200 text-slate-600"
                          )}>
                            {idx + 1}
                          </span>
                          <div className="text-sm font-medium text-slate-900">{p.name}</div>
                          <span className={classNames(
                            "ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                            idx === 0 ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-slate-100 border border-slate-200 text-slate-500"
                          )}>
                            {idx === 0 ? "Primary focus" : "Secondary"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Intervention */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-xs font-bold text-green-700">I</span>
                      <div className="text-sm font-semibold text-slate-900">Intervention — Food-Level Directives</div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {selectedCase.output_adime.I.directives.map((d: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                          <span className={classNames(
                            "mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                            d.action === "Replace" ? "bg-orange-100 text-orange-700 border border-orange-200"
                              : d.action === "Add" ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          )}>
                            {d.action}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{d.food}</div>
                            <div className="mt-0.5 text-xs text-slate-500">{d.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Monitoring & Evaluation */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-xs font-bold text-purple-700">M</span>
                        <div className="text-sm font-semibold text-slate-900">Monitoring</div>
                      </div>
                      <ul className="mt-3 space-y-2">
                        {selectedCase.output_adime.M.monitoring.map((m: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-300" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-700">E</span>
                        <div className="text-sm font-semibold text-slate-900">Evaluation Goals</div>
                      </div>
                      <ul className="mt-3 space-y-2">
                        {selectedCase.output_adime.M.evaluation.map((e: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />
                            {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* FHIR view */}
              {view === "fhir" ? (
                <CodeBlock title="FHIR R4 NutritionOrder" data={selectedCase.fhir_nutrition_order} />
              ) : null}

              {/* Raw JSON view */}
              {view === "safety" ? (
                <div className="space-y-4">
                  <CodeBlock title="Input Profile (JSON)" data={selectedCase.profile} />
                  <CodeBlock title="ADIME Output (JSON)" data={selectedCase.output_adime} />
                </div>
              ) : null}
            </div>
          </Section>

          <Section
            id="results"
            title="Experimental Results"
            subtitle="Evaluated on 330 multimorbid stroke patients from NHANES, benchmarked against 12 baselines including GPT-4.1 and Claude-Sonnet-4."
          >
            <div className="space-y-8">

              {/* ── 1. The Fluency Trap → Bubble Chart ── */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Finding 1</span>
                    <span className="text-sm font-semibold text-slate-900">The "Fluency Trap" — High Quality ≠ High Actionability</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-700 leading-relaxed">
                    Baseline models produce fluent text that scores respectably on expert review but fails to deliver actionable guidance.
                    <strong> ReAct-Qwen-72B scores 6.0/8</strong> in expert quality yet only <strong>20.8% actionability</strong>,
                    recommending vague categories like "healthy protein" instead of concrete food items.
                    The correlation between expert quality and actionability is only <em>r</em> = 0.63 (<em>p</em> &lt; 0.05),
                    confirming that <strong>specificity is necessary but insufficient for clinical quality</strong>.
                    NutriOrion also generates <strong>≈7× less output</strong> (2,663 vs. 17,925 chars) than frontier models while maintaining comparable accuracy,
                    reducing clinician review burden.
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-500">
                      Multi-Dimensional Performance Landscape — Actionability vs. Food Compass Score 2.0.
                      Bubble size = dietary diversity. Color = NutriScore. NutriOrion occupies the <strong className="text-slate-700">optimal frontier (top-right)</strong>.
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <img src={fig("bubble_chart.png")} alt="Bubble chart: actionability vs food quality" className="w-full h-auto rounded-lg" loading="lazy" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-500">
                      Nutritional Composition Improvements — NutriOrion reduces risk nutrients while increasing protective ones,
                      reflecting targeted, evidence-based dietary adjustments for chronic disease management.
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <img src={fig("nutrient_chart.png")} alt="Nutrient changes: energy, sodium, sugars down; potassium, fiber up" className="w-full h-auto rounded-lg" loading="lazy" />
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { label: "Energy", value: "−8%", color: "text-green-700 bg-green-50 border-green-100" },
                        { label: "Sodium", value: "−9%", color: "text-green-700 bg-green-50 border-green-100" },
                        { label: "Sugars", value: "−12%", color: "text-green-700 bg-green-50 border-green-100" },
                        { label: "Potassium", value: "+27%", color: "text-blue-700 bg-blue-50 border-blue-100" },
                        { label: "Fiber", value: "+167%", color: "text-blue-700 bg-blue-50 border-blue-100" },
                      ].map((n) => (
                        <div key={n.label} className={classNames("rounded-xl border p-2 text-center", n.color)}>
                          <div className="text-sm font-bold">{n.value}</div>
                          <div className="mt-0.5 text-[10px]">{n.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 2. Personalization → Heatmap ── */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-800">Finding 2</span>
                    <span className="text-sm font-semibold text-slate-900">Robust Personalization — Baselines Can Be Actively Unsafe</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-700 leading-relaxed">
                    NutriOrion consistently achieves the strongest negative correlations between patient biomarkers and dietary risk nutrients
                    (−0.26 to −0.35), meaning sicker patients receive safer food recommendations.
                    In contrast, several baselines exhibit <strong>dangerous positive correlations</strong> — recommending <em>more</em> risk nutrients to sicker patients:
                    CoT-LLaMA-3-70B shows <strong>+0.81 for glucose</strong> (high-sugar foods for diabetic patients),
                    Multiagent-Ensemble shows <strong>+0.78 for HbA1c</strong>.
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-500">
                      Personalization Heatmap — Pearson correlations between patient biomarkers and recommended nutrient content.
                      Blue (negative) = effective. Red (positive) = unsafe.
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <img src={fig("heatmap.png")} alt="Personalization heatmap" className="w-full h-auto rounded-lg" loading="lazy" />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="text-xs font-medium text-slate-500">NutriOrion's biomarker–nutrient correlations (all negative = safe).</div>
                    {[
                      { label: "Systolic BP → Sodium", value: "−0.26", desc: "Hypertensive patients receive lower-sodium foods" },
                      { label: "Glucose → Sugar", value: "−0.30", desc: "Elevated glucose triggers reduced sugar content" },
                      { label: "HbA1c → Sugar", value: "−0.35", desc: "Strongest signal — long-term glycemic control drives sugar restriction" },
                      { label: "Cholesterol → Fat", value: "−0.31", desc: "High cholesterol patients get lower-fat recommendations" },
                      { label: "BMI → Energy", value: "−0.19", desc: "Higher BMI correlates with reduced caloric density" },
                    ].map((d) => (
                      <div key={d.label} className="rounded-xl bg-blue-50 border border-blue-100 p-3 flex items-start gap-3">
                        <div className="shrink-0 rounded-lg bg-white border border-blue-200 px-2 py-1 text-sm font-bold text-blue-800 min-w-[55px] text-center">
                          {d.value}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-800">{d.label}</div>
                          <div className="text-[10px] text-slate-500">{d.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── 3. Active Safety → Drug Interaction Breakdown ── */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-semibold text-rose-800">Finding 3</span>
                    <span className="text-sm font-semibold text-slate-900">Active Safety vs. Passive Safety — The "Healthy Food Trap"</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-700 leading-relaxed">
                    Models with near-zero drug-food interaction violations (e.g., Ablation-NoADIME at 0.0%) achieve safety through
                    <strong> silence</strong> — failing to prescribe concrete food items entirely. This <em>passive safety</em> is clinically useless.
                    NutriOrion is the only open-source architecture achieving <strong>active safety</strong>:
                    97.8% actionability with violation rates (12.1%) comparable to frontier closed-source APIs (Claude 11.5%, GPT-4.1 16.6%).
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { drug: "Warfarin (n=28)", rate: "34.6%", note: "Vitamin K-rich vegetables (spinach, kale, broccoli)" },
                      { drug: "K-Sparing Diuretics (n=15)", rate: "58.3%", note: "High-potassium foods (bananas, avocados, tomatoes)" },
                      { drug: "Statins (n=114)", rate: "0.0%", note: "Successfully avoided grapefruit interactions" },
                    ].map((d) => (
                      <div key={d.drug} className="rounded-xl bg-white border border-rose-100 p-3">
                        <div className="text-xs font-semibold text-slate-800">{d.drug}</div>
                        <div className="mt-1 text-lg font-bold text-rose-700">{d.rate}</div>
                        <div className="mt-1 text-[10px] text-slate-500">{d.note}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-slate-500">
                    Residual Warfarin violations stem from a semantic gap: pharmaceutical labels say "avoid Vitamin K-rich foods"
                    without enumerating specific vegetables, highlighting the need for comprehensive drug-nutrient Knowledge Graphs.
                  </div>
                </div>
              </div>

              {/* ── 4. Architecture Ablation (RQ1-3) ── */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">Finding 4</span>
                    <span className="text-sm font-semibold text-slate-900">Both Role Specialization and Structured Workflow Are Necessary</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-700 leading-relaxed">
                    Controlled ablation studies answer three key research questions:
                  </div>
                  <div className="mt-3 space-y-2">
                    {[
                      {
                        rq: "RQ1",
                        q: "Can single agents replace multi-agent architectures?",
                        a: "No. Even frontier models (GPT-4.1: 6.5/8, Claude: 7.0/8) underperform NutriOrion (7.5/8), while open-source single agents score ≤ 6.0/8 with critically low actionability (7.8–43.4%).",
                      },
                      {
                        rq: "RQ2",
                        q: "How do roles and process contribute?",
                        a: "Removing ADIME structure (w/o ADIME → 0.0/8, 24.2% actionability) or specialized roles (w/o Roles → 2.0/8, 16.6% DNI violations) both degrade to baseline levels.",
                      },
                      {
                        rq: "RQ3",
                        q: "Is structured collaboration superior?",
                        a: "Yes. Unstructured Round Table (1.0/8) and Ensemble Voting (0.0/8) both fail to produce valid ADIME outputs, confirming the DAG-based workflow is essential.",
                      },
                    ].map((item) => (
                      <div key={item.rq} className="rounded-xl bg-white border border-indigo-100 p-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">{item.rq}</span>
                          <span className="text-xs font-medium text-slate-800">{item.q}</span>
                        </div>
                        <div className="mt-1.5 text-xs text-slate-600 leading-relaxed">{item.a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── 5. Clinical Validation → Radar Chart + RD Feedback ── */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-slate-900">Clinical Appropriateness (RD Evaluation)</div>
                    <div className="text-xs text-slate-500">
                      30 randomly selected plans evaluated by two Board-Certified Registered Dietitians
                      using a structured survey across 6 NCP dimensions (Cohen's κ = 0.82).
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <img src={fig("radar_chart.png")} alt="Radar chart: 6-dimension RD evaluation" className="w-full h-auto rounded-lg" loading="lazy" />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="text-sm font-semibold text-slate-900">Expert-Rated Metrics</div>
                    {[
                      { label: "Guideline Alignment", value: "4.69 / 5", desc: "Highest rated — aligns with DASH, ADA protocols" },
                      { label: "Dietary Components", value: "4.66 / 5", desc: "Appropriate nutrient targets for identified conditions" },
                      { label: "Dietary Balance", value: "4.51 / 5", desc: "Effective multimorbidity balancing" },
                      { label: "Safety Rating", value: "4.28 / 5", desc: "85.6% of items received positive safety ratings" },
                      { label: "Clinical Acceptability", value: "81.4%", desc: "Plans rated acceptable for clinical use" },
                      { label: "Adoption Intention", value: "64.4%", desc: "RDs willing to sign off on generated plans" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-start gap-3">
                        <div className="shrink-0 rounded-lg bg-white border border-slate-200 px-2 py-1 text-sm font-bold text-slate-900 min-w-[70px] text-center">
                          {item.value}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-800">{item.label}</div>
                          <div className="text-[10px] text-slate-500">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-700">Open Direction</span>
                    <span className="text-sm font-semibold text-slate-900">RD Feedback: From "What to Eat" to "How to Prepare"</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-700 leading-relaxed">
                    Overall Quality scored 3.87/5 — but open-text feedback clarified the gap is
                    <strong> logistical, not clinical</strong>: recommendations are chemically accurate and specific but lack
                    "practical meal preparation guidance (e.g., recipes, culinary methods, portion sizes)."
                    Future clinical LLMs must extend beyond nutrient-level reasoning to culinary-level planning.
                  </div>
                </div>
              </div>

            </div>
          </Section>

          <Section
            id="safety"
            title="Safety by Construction"
            subtitle="Pharmacological constraints are injected during synthesis as hard negatives — not filtered after generation."
          >
            <div className="space-y-6">

              {/* Core Principle */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                    <div className="text-sm font-semibold text-slate-900">Why Not Post-Hoc Filtering?</div>
                    <div className="mt-2 text-sm text-slate-700 leading-relaxed">
                      Most AI systems generate a complete plan first, then remove unsafe items. This creates
                      <strong> plan incoherence</strong>: removing a food leaves nutritional gaps without compensating substitutions.
                      NutriOrion instead injects safety constraints <em>into</em> the synthesis prompt, so the model
                      never proposes violating actions in the first place — the plan is <strong>valid by construction</strong>.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-sm font-semibold text-slate-900">Formal Safety Guarantee</div>
                    <div className="mt-2 text-sm text-slate-700 leading-relaxed">
                      Let <MathTip tip="The set of Drug-Nutrient Interactions identified by the Medication Agent via DailyMed retrieval.">C_safe</MathTip> be
                      the DNI constraints extracted from Stage 1. During synthesis, the Report Agent
                      maximizes clinical utility <MathTip tip="Utility function over the generated plan, balancing nutritional completeness, guideline adherence, and patient preference.">U(Yp)</MathTip> subject to:
                    </div>
                    <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
                      <span className="font-mono text-sm text-slate-800">
                        ∀d ∈ <MathTip tip="Each drug-nutrient interaction constraint.">C_safe</MathTip>,
                        Sim(<MathTip tip="The generated nutrition plan.">Yp</MathTip>, <MathTip tip="The contraindicated food/nutrient associated with drug d.">d_contraindication</MathTip>) {"<"} <MathTip tip="A near-zero threshold ensuring the plan avoids contraindicated items.">ε</MathTip>
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      This ensures the generated plan has near-zero semantic similarity to any known contraindication.
                    </div>
                  </div>
                </div>

                {/* Three-Stage Safety Pipeline */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-slate-900">Three-Stage Safety Pipeline</div>
                  {[
                    {
                      stage: "Stage 1",
                      title: "Evidence Retrieval",
                      color: "border-blue-200 bg-blue-50",
                      tagColor: "bg-blue-200 text-blue-800",
                      desc: "The Medication Agent queries FDA DailyMed for each patient medication, extracting warning sections and contraindicated nutrients.",
                      detail: "Drug labels → contraindicated food categories (e.g., Warfarin → Vitamin K-rich foods)",
                    },
                    {
                      stage: "Stage 2",
                      title: "Constraint Extraction",
                      color: "border-amber-200 bg-amber-50",
                      tagColor: "bg-amber-200 text-amber-800",
                      desc: "ExtractConstraints() parses medication agent insights into structured hard negative constraints — specific food items to avoid.",
                      detail: "C_safe ← ExtractConstraints(C, a_med)",
                    },
                    {
                      stage: "Stage 3",
                      title: "Constrained Synthesis",
                      color: "border-emerald-200 bg-emerald-50",
                      tagColor: "bg-emerald-200 text-emerald-800",
                      desc: "The Report Agent receives C_safe as mandatory exclusions in its synthesis prompt. Generation is bounded: the model cannot propose any action matching a constraint.",
                      detail: "Yp ← a_report(L, C, C_safe) — plan is valid by construction",
                    },
                  ].map((s) => (
                    <div key={s.stage} className={classNames("rounded-2xl border p-4", s.color)}>
                      <div className="flex items-center gap-2">
                        <span className={classNames("rounded-full px-2 py-0.5 text-[10px] font-semibold", s.tagColor)}>{s.stage}</span>
                        <span className="text-sm font-semibold text-slate-900">{s.title}</span>
                      </div>
                      <div className="mt-2 text-sm text-slate-700 leading-relaxed">{s.desc}</div>
                      <div className="mt-2 font-mono text-xs text-slate-500">{s.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Three High-Risk Scenarios */}
              <div>
                <div className="text-sm font-semibold text-slate-900">High-Risk Drug-Food Interaction Scenarios</div>
                <div className="mt-1 text-xs text-slate-500">
                  Three clinically critical cohorts from the NHANES stroke patient population, with well-documented and potentially severe dietary interactions.
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    {
                      drug: "Warfarin",
                      n: 28,
                      mechanism: "Vitamin K antagonist — dietary Vitamin K competes with drug binding, reducing anticoagulant efficacy",
                      foods: ["Spinach", "Kale", "Broccoli", "Brussels sprouts", "Green tea"],
                      risk: "Increased clot risk → stroke recurrence",
                      color: "border-rose-200",
                      dotColor: "bg-rose-400",
                    },
                    {
                      drug: "K-Sparing Diuretics",
                      n: 15,
                      mechanism: "Reduces renal potassium excretion — high-potassium foods compound retention risk",
                      foods: ["Bananas", "Avocados", "Tomatoes", "Oranges", "Salt substitutes (KCl)"],
                      risk: "Hyperkalemia → cardiac arrhythmia",
                      color: "border-amber-200",
                      dotColor: "bg-amber-400",
                    },
                    {
                      drug: "Statins + Stroke Meds",
                      n: 114,
                      mechanism: "CYP3A4 inhibition by furanocoumarins — grapefruit amplifies statin bioavailability",
                      foods: ["Grapefruit", "Grapefruit juice", "Seville oranges", "Pomelo"],
                      risk: "Rhabdomyolysis (muscle breakdown)",
                      color: "border-blue-200",
                      dotColor: "bg-blue-400",
                    },
                  ].map((s) => (
                    <div key={s.drug} className={classNames("rounded-2xl border bg-white p-4", s.color)}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900">{s.drug}</div>
                        <span className="text-[10px] text-slate-400">n = {s.n}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-600 leading-relaxed">{s.mechanism}</div>
                      <div className="mt-3">
                        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Contraindicated Foods</div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {s.foods.map((f) => (
                            <span key={f} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                              <span className={classNames("h-1.5 w-1.5 rounded-full", s.dotColor)} />
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-1.5">
                        <span className="text-[10px] font-medium text-red-700">Risk: {s.risk}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Constraint Injection Example */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-semibold text-slate-900">Example: Constraint Injection for a Warfarin Patient</div>
                <div className="mt-2 text-xs text-slate-500">
                  The safety context injected into the Report Agent's synthesis prompt (simplified). The agent receives this as mandatory exclusions before generating the nutrition plan.
                </div>
                <pre className="mt-3 text-xs leading-5 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-auto">{`── HARD NEGATIVE CONSTRAINTS (from Medication Agent via DailyMed) ──

Patient Medications: Warfarin 5mg daily, Lisinopril 10mg daily

[CONSTRAINT 1 — Warfarin / Vitamin K Interaction]
  Source:  DailyMed Label #SPL-12345 → "Warnings and Precautions"
  Rule:    DO NOT recommend foods high in Vitamin K
  Blocked: spinach, kale, broccoli, brussels sprouts, green tea,
           collard greens, swiss chard, parsley (large amounts)
  Action:  If patient currently eats these → "Continue current intake
           level, do NOT increase. Coordinate with prescriber."

[CONSTRAINT 2 — Lisinopril / Potassium Interaction]
  Source:  DailyMed Label #SPL-67890 → "Drug Interactions"
  Rule:    AVOID high-potassium supplements and salt substitutes
  Blocked: potassium chloride salt substitutes, potassium supplements
  Action:  Monitor serum potassium; moderate dietary potassium is acceptable

── SYNTHESIS MUST NOT VIOLATE ANY CONSTRAINT ABOVE ──`}</pre>
              </div>

            </div>
          </Section>

          <Section id="team" title="Team" subtitle="">
            <div className="flex flex-wrap items-start gap-x-6 gap-y-3 text-sm text-slate-700">
              {[
                { name: "Junwei Wu", aff: "Emory" },
                { name: "Runze Yan", aff: "Emory" },
                { name: "Hanqi Luo", aff: "Emory" },
                { name: "Darren Liu", aff: "Emory" },
                { name: "Minxiao Wang", aff: "Emory" },
                { name: "Kimberly L. Townsend", aff: "TWU" },
                { name: "Lydia S. Hartwig", aff: "Cecelia Health" },
                { name: "Derek Milketinas", aff: "TWU" },
                { name: "Xiao Hu", aff: "Emory" },
                { name: "Carl Yang", aff: "Emory" },
              ].map((p, i) => (
                <span key={i} className="whitespace-nowrap">
                  <span className="font-medium text-slate-900">{p.name}</span>
                  <sup className="ml-0.5 text-[10px] text-slate-400">{p.aff}</sup>
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
              <span>Contact: junwei.wu@emory.edu · j.carlyang@emory.edu</span>
            </div>
          </Section>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-xs font-semibold text-amber-900">Disclaimer</div>
            <div className="mt-1 text-sm text-amber-900/90">{disclaimer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
