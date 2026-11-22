export type ServerConfig = {
  javaAddress: string;
  bedrockAddress: string;
  bedrockPort: string;
  eventsAddress: string;
  eventsPort: string;
  javaVersion: string;
  bedrockVersion: string;
  crossplay: "enabled" | "disabled" | "not-configured";
  description: string;
  gameplayType: string;
  discordInvite: string;
};

export const serverConfig: ServerConfig = {
  javaAddress: "play.seraphyx.fun",
  bedrockAddress: "play.seraphyx.fun",
  bedrockPort: "19293",
  eventsAddress: "seraphyxgames.atbp.fun",
  eventsPort: "19506",
  javaVersion: "",
  bedrockVersion: "",
  crossplay: "not-configured",
  description: "SERAPHYX SMP is preparing its official community platform.",
  gameplayType: "Not yet configured",
  discordInvite: "",
};
