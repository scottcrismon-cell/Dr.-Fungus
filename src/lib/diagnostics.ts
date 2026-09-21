export type DiagnosticInput = {
  assessmentId: string;
  imageUrl: string | null;
  concern: string;
  notes: string;
};

export type DiagnosticResult = {
  status: "not_connected";
  message: string;
};

/**
 * Future AI boundary.
 * Replace this implementation with a call to a validated diagnostic service.
 * Keep clinical claims, confidence thresholds, escalation logic, and audit logs
 * on the server—not in the browser.
 */
export async function runDiagnosticPlaceholder(
  _input: DiagnosticInput,
): Promise<DiagnosticResult> {
  await new Promise((resolve) => window.setTimeout(resolve, 900));

  return {
    status: "not_connected",
    message:
      "Your photo was received. The diagnostic model is not connected yet, so no medical assessment was produced.",
  };
}
