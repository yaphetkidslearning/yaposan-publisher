export type DesktopReleaseEnvironment = Record<string, string | undefined>;
export type DesktopTarget = "windows" | "macos" | "linux";
export type DesktopTargetCertification = {
  target: DesktopTarget;
  configured: boolean;
  signed: boolean;
  artifactPresent: boolean;
  blockers: string[];
};
export type DesktopReleaseCertification = {
  schema: "yaposan.rc11.desktop-release";
  version: 1;
  generatedAt: number;
  targets: DesktopTargetCertification[];
  updateFeedConfigured: boolean;
  allConfigured: boolean;
  releaseReady: boolean;
};

const present = (env: DesktopReleaseEnvironment, name: string) => Boolean(env[name]?.trim());

export function certifyDesktopRelease(
  env: DesktopReleaseEnvironment,
  artifacts: Partial<Record<DesktopTarget, boolean>> = {},
): DesktopReleaseCertification {
  const updateFeedConfigured = present(env, "YAPOSAN_UPDATE_URL") && /^https:\/\//i.test(env.YAPOSAN_UPDATE_URL!);
  const windowsSigned = present(env, "CSC_LINK") && present(env, "CSC_KEY_PASSWORD");
  const macSigned = present(env, "CSC_LINK") && present(env, "CSC_KEY_PASSWORD") && present(env, "APPLE_ID") && present(env, "APPLE_APP_SPECIFIC_PASSWORD") && present(env, "APPLE_TEAM_ID");
  const targets: DesktopTargetCertification[] = [
    {
      target: "windows",
      configured: windowsSigned && updateFeedConfigured,
      signed: windowsSigned,
      artifactPresent: Boolean(artifacts.windows),
      blockers: [!windowsSigned && "Windows code-signing credentials are missing.", !updateFeedConfigured && "HTTPS update feed is missing.", !artifacts.windows && "Windows installer artifact is missing."].filter(Boolean) as string[],
    },
    {
      target: "macos",
      configured: macSigned && updateFeedConfigured,
      signed: macSigned,
      artifactPresent: Boolean(artifacts.macos),
      blockers: [!macSigned && "macOS signing or notarization credentials are missing.", !updateFeedConfigured && "HTTPS update feed is missing.", !artifacts.macos && "macOS DMG artifact is missing."].filter(Boolean) as string[],
    },
    {
      target: "linux",
      configured: updateFeedConfigured,
      signed: false,
      artifactPresent: Boolean(artifacts.linux),
      blockers: [!updateFeedConfigured && "HTTPS update feed is missing.", !artifacts.linux && "Linux package artifact is missing."].filter(Boolean) as string[],
    },
  ];
  const allConfigured = targets.every((target) => target.configured);
  return {
    schema: "yaposan.rc11.desktop-release",
    version: 1,
    generatedAt: Date.now(),
    targets,
    updateFeedConfigured,
    allConfigured,
    releaseReady: targets.every((target) => target.configured && target.artifactPresent),
  };
}

export function validateDesktopFileAssociation(filePath: string): boolean {
  return /\.(yaposan|ypt|pubx)$/i.test(filePath) && !filePath.includes("\0");
}
