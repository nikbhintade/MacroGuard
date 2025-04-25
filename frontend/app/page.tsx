"use client";

import Policies from "@/components/Policies";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import NotConnected from "@/components/NotConnected";

export default function Home() {
  const { account } = useWalletConnection();
  return (
    <div>
      <div className="pt-20">{account ? <Policies /> : <NotConnected />}</div>
    </div>
  );
}
