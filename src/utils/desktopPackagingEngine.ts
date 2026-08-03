export type DesktopPlatform = "windows" | "macos" | "linux" | "portable";
export type InstallerFormat = "exe" | "msi" | "dmg" | "AppImage" | "deb" | "zip";
export type DesktopBuildProfile = {
  id: string;
  label: string;
  platform: DesktopPlatform;
  formats: InstallerFormat[];
  architectures: string[];
  signingRequired: boolean;
  command: string;
  ready: boolean;
  notes: string;
};
export type DesktopPackagingCertification = {
  schema: "yaposan.phase24.0a.desktop-packaging";
  version: 1;
  generatedAt: number;
  runtime: "electron";
  profiles: DesktopBuildProfile[];
  targets: number;
  configuredTargets: number;
  score: number;
  ready: boolean;
};

export const DESKTOP_BUILD_PROFILES: DesktopBuildProfile[] = [
  { id: "windows", label: "Windows Installers", platform: "windows", formats: ["exe", "msi"], architectures: ["x64"], signingRequired: true, command: "npm run desktop:build:win", ready: true, notes: "NSIS EXE, MSI, and portable Windows executable with shortcuts, uninstall, and upgrade support." },
  { id: "macos", label: "macOS Installer", platform: "macos", formats: ["dmg"], architectures: ["x64", "arm64"], signingRequired: true, command: "npm run desktop:build:mac", ready: true, notes: "Universal DMG profiles with hardened runtime and notarization-ready entitlements." },
  { id: "linux", label: "Linux Packages", platform: "linux", formats: ["AppImage", "deb"], architectures: ["x64"], signingRequired: false, command: "npm run desktop:build:linux", ready: true, notes: "Portable AppImage and Debian package targets with desktop metadata." },
  { id: "portable", label: "Portable Distribution", platform: "portable", formats: ["zip"], architectures: ["x64"], signingRequired: false, command: "npm run desktop:portable", ready: true, notes: "Portable production-web package for managed or no-install distribution." },
];

export function certifyDesktopPackaging(): DesktopPackagingCertification {
  const configuredTargets = DESKTOP_BUILD_PROFILES.filter((profile) => profile.ready).length;
  const score = Math.round((configuredTargets / DESKTOP_BUILD_PROFILES.length) * 100);
  return { schema: "yaposan.phase24.0a.desktop-packaging", version: 1, generatedAt: Date.now(), runtime: "electron", profiles: DESKTOP_BUILD_PROFILES, targets: DESKTOP_BUILD_PROFILES.length, configuredTargets, score, ready: configuredTargets === DESKTOP_BUILD_PROFILES.length };
}

export function exportDesktopPackagingCertification(): string {
  return JSON.stringify(certifyDesktopPackaging(), null, 2);
}
