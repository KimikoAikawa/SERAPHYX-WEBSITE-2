const cache = new Map();

exports.handler = async () => {
  const address = process.env.JAVA_SERVER_ADDRESS;
  if (!address) {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=30" },
      body: JSON.stringify({
        online: null,
        players: null,
        maxPlayers: null,
        updatedAt: null,
        error: "JAVA_SERVER_ADDRESS is not configured",
      }),
    };
  }

  const now = Date.now();
  const cached = cache.get(address);
  if (cached && now - cached.time < 30000) {
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(cached.value) };
  }

  try {
    const host = address.split(":")[0];
    const port = address.includes(":") ? address.split(":").pop() : "";
    const response = await fetch(`https://api.mcstatus.io/v2/status/java/${encodeURIComponent(port ? `${host}:${port}` : host)}`);
    if (!response.ok) throw new Error(`Status provider returned ${response.status}`);
    const data = await response.json();
    const value = {
      online: Boolean(data.online),
      players: data.players?.online ?? null,
      maxPlayers: data.players?.max ?? null,
      updatedAt: new Date().toISOString(),
    };
    cache.set(address, { time: now, value });
    return { statusCode: 200, headers: { "content-type": "application/json", "cache-control": "public, max-age=30" }, body: JSON.stringify(value) };
  } catch (error) {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
      body: JSON.stringify({ online: null, players: null, maxPlayers: null, updatedAt: null, error: "Unable to query server status" }),
    };
  }
};
