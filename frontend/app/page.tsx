"use client";

import Policies from "@/components/Policies";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import NotConnected from "@/components/NotConnected";

export default function Home() {
  const { isConnected } = useWalletConnection();
  return (
    <div>
      <div className="pt-20">
        {isConnected ? <Policies /> : <NotConnected />}
      </div>
    </div>
  );
}
