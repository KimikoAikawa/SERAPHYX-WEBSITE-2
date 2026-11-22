import { useEffect, useState } from "react";
import { serverConfig, type ServerConfig } from "./config";

type ServerConfigRow = {
  java_address: string;
  bedrock_address: string;
  bedrock_port: string;
  events_address: string;
  events_port: string;
  java_version: string;
  bedrock_version: string;
  crossplay: string;
  description: string;
  gameplay_type: string;
  discord_invite: string;
};

export function useServerConfig() {
  const [config, setConfig] = useState<ServerConfig>(serverConfig);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { supabase } = await import("./supabase");
      if (!active || !supabase) {
        if (active) setError("Live server settings are not connected; showing the published initial connection details.");
        return;
      }

      const { data, error: queryError } = await supabase
        .from("server_config")
        .select("java_address,bedrock_address,bedrock_port,events_address,events_port,java_version,bedrock_version,crossplay,description,gameplay_type,discord_invite")
        .eq("id", 1)
        .maybeSingle();
      if (!active) return;
      if (queryError || !data) {
        setError("Could not load the latest server settings; showing the published initial connection details.");
        return;
      }

      const row = data as ServerConfigRow;
      setConfig({
        javaAddress: row.java_address,
        bedrockAddress: row.bedrock_address,
        bedrockPort: row.bedrock_port,
        eventsAddress: row.events_address,
        eventsPort: row.events_port,
        javaVersion: row.java_version,
        bedrockVersion: row.bedrock_version,
        crossplay: row.crossplay === "enabled" || row.crossplay === "disabled" ? row.crossplay : "not-configured",
        description: row.description,
        gameplayType: row.gameplay_type,
        discordInvite: row.discord_invite,
      });
      setError("");
    };

    void load().catch(() => {
      if (active) setError("Could not load the latest server settings; showing the published initial connection details.");
    });
    return () => {
      active = false;
    };
  }, []);

  return { config, error };
}
