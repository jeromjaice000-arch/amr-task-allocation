
const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function runSimulation(robots, tasks, algorithm) {
  const response = await fetch(
    `${API_URL}/api/simulate?algorithm=${encodeURIComponent(algorithm)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ robots, tasks })
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : `Simulation failed (HTTP ${response.status})`
    );
  }

  return response.json();
}
