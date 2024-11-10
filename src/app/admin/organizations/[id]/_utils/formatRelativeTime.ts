export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "Never";

  const now = new Date();
  const auditDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - auditDate.getTime()) / 1000);

  // Less than a minute ago
  if (diffInSeconds < 60) {
    return "<1 min ago";
  }
  if (diffInSeconds < 300) {
    return "<5 min ago";
  }

  // Less than an hour ago
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    // Round to nearest 5 minutes
    const roundedMinutes = Math.round(minutes / 5) * 5;
    return `${roundedMinutes} min ago`;
  }

  // Default to date format
  return auditDate.toLocaleDateString();
}
