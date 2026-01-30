import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterConnector } from "@farcaster/miniapp-wagmi-connector";

export const config = createConfig({
  chains: [base],
  connectors: [
    farcasterConnector(),
  ],
  transports: {
    [base.id]: http(),
  },
});
