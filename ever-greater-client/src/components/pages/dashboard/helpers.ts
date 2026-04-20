export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function formatPresetLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatSignedValue(value: number): string {
  if (value > 0) {
    return `+${value.toFixed(1)}%`;
  }

  if (value < 0) {
    return `${value.toFixed(1)}%`;
  }

  return "0.0%";
}

export function formatTimestamp(timestamp: number | null): string {
  if (!timestamp) {
    return "Awaiting first update";
  }

  return new Date(timestamp).toLocaleTimeString();
}
