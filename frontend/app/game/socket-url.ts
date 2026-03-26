export function resolveSocketUrl() {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL;
  const socketPort = process.env.NEXT_PUBLIC_SOCKET_PORT;

  if (typeof window === "undefined") {
    return configured || "http://localhost:3001";
  }

  if (!configured) {
    return `${window.location.protocol}//${window.location.hostname}:${socketPort}`;
  }

  try {
    const parsed = new URL(configured);

    if (parsed.hostname === "socket-server") {
      return `${window.location.protocol}//${window.location.hostname}:${socketPort}`;
    }

    return configured;
  } catch {
    return `${window.location.protocol}//${window.location.hostname}:${socketPort}`;
  }
}
