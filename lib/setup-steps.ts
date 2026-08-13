import {
  PLATFORM_LABELS,
  PLATFORMS,
  type Platform,
} from "@/lib/platform-config";
import type { SetupStep, SetupStepId } from "@/types/setup";

export function buildSetupSteps(assignedPlatforms: Platform[]): SetupStep[] {
  const steps: SetupStep[] = [{ id: "profile", label: "Work profile" }];
  const assigned = new Set(assignedPlatforms);
  const hasFacebook =
    assigned.has("facebook_personal") || assigned.has("facebook_umbrella");

  for (const platform of PLATFORMS) {
    if (platform === "facebook_personal" || platform === "facebook_umbrella") {
      if (platform === "facebook_personal" && hasFacebook) {
        steps.push({ id: "facebook", label: "Facebook" });
      }
      continue;
    }
    if (assigned.has(platform)) {
      steps.push({ id: platform, label: PLATFORM_LABELS[platform] });
    }
  }

  return steps;
}

export function platformsForSetupStep(stepId: SetupStepId): Platform[] {
  if (stepId === "profile") return [];
  if (stepId === "facebook") return ["facebook_personal", "facebook_umbrella"];
  return [stepId];
}

export function setupStepLabel(step: SetupStep, index: number, total: number) {
  return `Step ${index + 1} of ${total} · ${step.label}`;
}
