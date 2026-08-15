import {
  assembleEditableProject,
  buildCreationPlan,
  buildProviderPlan,
  type CreationCapability,
  type CreationPlan,
  type EditableProjectDraft,
} from "./creativeCreationEngine";

export type OrchestrationStage = "understand" | "plan" | "generate" | "assemble" | "ready";
export type ProviderExecution = {
  capability: CreationCapability;
  provider: string;
  model?: string;
  output?: unknown;
  status: "generated" | "fallback" | "skipped";
  warning?: string;
};
export type CreationGenerator = (input: {
  capability: CreationCapability;
  prompt: string;
  plan: CreationPlan;
}) => Promise<{ provider: string; model?: string; output: unknown }>;
export type OrchestrationResult = {
  stage: OrchestrationStage;
  plan: CreationPlan;
  project: EditableProjectDraft & { generated?: Record<string, unknown> };
  providerPlan: ReturnType<typeof buildProviderPlan>;
  executions: ProviderExecution[];
  warnings: string[];
};

function generationPrompt(plan: CreationPlan, capability: CreationCapability) {
  return [
    `You are the ${capability} generation lane inside Yaposan Create.`,
    `Create production-ready material for this ${plan.intent.label.toLowerCase()} request:`,
    plan.prompt,
    "",
    `Destination: ${plan.intent.destination}`,
    `Project title: ${plan.title}`,
    "Return useful editable content/assets guidance, not an explanation of how to create it.",
  ].join("\n");
}

export async function orchestrateCreation(
  prompt: string,
  options: { generate?: CreationGenerator } = {},
): Promise<OrchestrationResult> {
  const clean = prompt.trim();
  if (!clean) throw new Error("Describe what you want to create.");

  const plan = buildCreationPlan(clean);
  const providerPlan = buildProviderPlan(plan);
  const executions: ProviderExecution[] = [];
  const generated: Record<string, unknown> = {};
  const warnings: string[] = [];

  const uniqueCapabilities = [...new Set(plan.steps.map((item) => item.capability))];
  for (const capability of uniqueCapabilities) {
    if (!options.generate) {
      executions.push({ capability, provider: "local", status: "fallback" });
      continue;
    }
    try {
      const result = await options.generate({
        capability,
        prompt: generationPrompt(plan, capability),
        plan,
      });
      executions.push({
        capability,
        provider: result.provider,
        model: result.model,
        output: result.output,
        status: "generated",
      });
      generated[capability] = result.output;
    } catch (error) {
      const warning = error instanceof Error ? error.message : "Provider generation failed";
      executions.push({ capability, provider: "local", status: "fallback", warning });
      warnings.push(`${capability}: ${warning}`);
    }
  }

  const mediaCapabilities = uniqueCapabilities.filter((capability) =>
    ["image", "video", "audio"].includes(capability),
  );
  if (!options.generate && mediaCapabilities.length) {
    warnings.push(
      "Generative media steps use connected providers when available and retain a local/provider-ready fallback when they are not configured.",
    );
  }

  const project = {
    ...assembleEditableProject(plan),
    generated: Object.keys(generated).length ? generated : undefined,
  };
  if (generated.text && typeof generated.text === "string") {
    project.content.body = generated.text;
  }

  return { stage: "ready", plan, project, providerPlan, executions, warnings };
}
