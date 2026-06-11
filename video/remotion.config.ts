import { Config } from "@remotion/cli/config";

// Bewusst ohne Tailwind: die Szenen nutzen Inline-Styles + theme.ts. Weniger
// Setup, nichts kann an einer fehlenden Tailwind-Config scheitern.
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
