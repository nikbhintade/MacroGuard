"use client";

import Policies from "@/components/Policies";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import NotConnected from "@/components/NotConnected";

export default function Home() {
  const { isConnected } = useWalletConnection();
  return (
    <div>
      <div>
        {isConnected ? (
          <div>
            <div className="flex flex-col items-center p-2 bg-gray-900 border border-gray-600 rounded-lg">
              <p>Make sure you mint the tokens first before buying insurance</p>
              <a
                href="https://coston2-explorer.flare.network/address/0xeEf81df5961036265a336431232506824DcA9488?tab=txs"
                target="_blank"
                className="underline"
              >
                Mint Tokens
              </a>
            </div>
            <Policies />
          </div>
        ) : (
          <NotConnected />
        )}
      </div>
    </div>
  );
}
