// Predefined distinct colors for team members on the calendar
const TEAM_COLORS = [
  "#F5A623", // Gold
  "#4ECDC4", // Teal
  "#FF6B6B", // Coral
  "#A78BFA", // Purple
  "#34D399", // Emerald
  "#F472B6", // Pink
  "#60A5FA", // Blue
  "#FBBF24", // Amber
  "#FB923C", // Orange
  "#818CF8", // Indigo
  "#2DD4BF", // Cyan
  "#E879F9", // Fuchsia
  "#A3E635", // Lime
  "#38BDF8", // Sky
  "#FB7185", // Rose
  "#C084FC", // Violet
  "#22D3EE", // Light Cyan
  "#F97316", // Dark Orange
  "#84CC16", // Olive
  "#EC4899", // Magenta
  "#14B8A6", // Dark Teal
  "#8B5CF6", // Deep Purple
  "#EF4444", // Red
  "#06B6D4", // Deep Cyan
  "#D946EF", // Bright Fuchsia
  "#10B981", // Deep Green
  "#F59E0B", // Deep Amber
  "#6366F1", // Deep Indigo
  "#0EA5E9", // Deep Sky
  "#E11D48", // Deep Rose
];

export function getNextColor(usedColors: string[]): string {
  const available = TEAM_COLORS.find((c) => !usedColors.includes(c));
  return available || TEAM_COLORS[usedColors.length % TEAM_COLORS.length];
}
