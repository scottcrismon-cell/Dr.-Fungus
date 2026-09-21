export type DiagnosticInput = {
  assessmentId: string;
  imageUrl: string | null;
  concern: string;
  notes: string;
};

export type DiagnosticResult = {
  status: "simulated";
  headline: string;
  summary: string;
  possibleMatch: string;
  otherPossibilities: string[];
  nextSteps: string[];
  urgency: "Routine" | "Soon";
  disclaimer: string;
};

const simulatedResults: Record<
  string,
  Pick<
    DiagnosticResult,
    "headline" | "summary" | "possibleMatch" | "otherPossibilities" | "nextSteps" | "urgency"
  >
> = {
  "Toenail change": {
    headline: "This may resemble a common fungal nail change",
    summary:
      "Thickening, discoloration, or a brittle nail can occur with nail fungus, but injury and several skin conditions can look similar.",
    possibleMatch: "Fungal nail infection (onychomycosis)",
    otherPossibilities: ["Repeated nail trauma", "Psoriasis or another nail condition"],
    nextSteps: [
      "Keep the nail clean, dry, and trimmed straight across.",
      "Avoid sharing clippers, shoes, or towels.",
      "Ask a clinician or podiatrist to confirm the cause before treatment.",
    ],
    urgency: "Routine",
  },
  "Skin irritation or rash": {
    headline: "This may resemble athlete’s foot or another irritation",
    summary:
      "Scaling, itching, or redness can occur with a fungal rash, but eczema, contact irritation, and other rashes may appear similar.",
    possibleMatch: "Athlete’s foot (tinea pedis)",
    otherPossibilities: ["Contact dermatitis", "Eczema or dry, irritated skin"],
    nextSteps: [
      "Keep the area clean and dry, especially between the toes.",
      "Change damp socks and let shoes dry completely.",
      "Talk with a pharmacist or clinician if it spreads or does not improve.",
    ],
    urgency: "Routine",
  },
  Discoloration: {
    headline: "The color change deserves a closer look",
    summary:
      "Color changes can come from bruising, nail fungus, pressure, or other causes. A photo alone cannot reliably tell these apart.",
    possibleMatch: "Bruising or pressure-related nail change",
    otherPossibilities: ["Fungal nail infection", "A pigmented nail condition"],
    nextSteps: [
      "Note whether the mark moves outward as the nail grows.",
      "Avoid tight shoes and further pressure on the area.",
      "Arrange a clinician visit for a new dark streak or unexplained dark spot.",
    ],
    urgency: "Soon",
  },
  "Swelling or soreness": {
    headline: "Swelling or soreness may need an in-person exam",
    summary:
      "Tenderness and swelling can occur with an ingrown nail, irritation, injury, or infection. The surrounding skin and symptoms matter.",
    possibleMatch: "Irritated or ingrown toenail",
    otherPossibilities: ["Minor injury", "Skin or nail-fold infection"],
    nextSteps: [
      "Reduce pressure from tight shoes and keep the area clean.",
      "Do not cut deeply into the nail corner or drain it yourself.",
      "Contact a clinician if pain, warmth, redness, or drainage increases.",
    ],
    urgency: "Soon",
  },
  "Other concern": {
    headline: "An in-person review is the safest next step",
    summary:
      "There is not enough information in this prototype to narrow the cause of this concern.",
    possibleMatch: "No simulated match available",
    otherPossibilities: ["A nail condition", "A skin, pressure, or injury-related change"],
    nextSteps: [
      "Keep a note of when the change began and how it is evolving.",
      "Avoid picking, cutting, or applying harsh products to the area.",
      "Share the photo and your symptoms with a clinician or podiatrist.",
    ],
    urgency: "Routine",
  },
};

/**
 * Prototype-only diagnostic boundary. This does not inspect the image; it
 * selects prewritten educational content from the chosen concern category.
 */
export async function runDiagnosticPlaceholder(
  input: DiagnosticInput,
): Promise<DiagnosticResult> {
  await new Promise((resolve) => window.setTimeout(resolve, 1100));

  const simulated = simulatedResults[input.concern] ?? simulatedResults["Other concern"];

  return {
    status: "simulated",
    ...simulated,
    disclaimer:
      "Simulated result only. This prototype did not analyze your photo and this is not a medical diagnosis.",
  };
}
