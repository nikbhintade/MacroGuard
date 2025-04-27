"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { flareTestnet } from "viem/chains";
import contractJson from "@/abi/macroguard.json";
import tokenJson from "@/abi/token.json";
import { useWalletConnection } from "@/hooks/useWalletConnection";

const contractAddress = "0xec4774B4F26cD511b8545348D4Bb00a1Ad9b44B9";
const contractAbi = contractJson.abi;

export default function PolicyForm() {
  const [policyId, setPolicyId] = useState("");
  const { account, client } = useWalletConnection();

  const handleSubmit = async () => {
    try {
      if (!client) {
        throw new Error("Wallet client could not be created");
      }
      if (!account) {
        throw new Error("Wallet client could not be created");
      }
      await client.writeContract({
        account: account,
        address: contractAddress,
        abi: contractAbi,
        functionName: "expirePolicy",
        chain: flareTestnet,
        args: [BigInt(policyId)],
      });
      console.log("Policy expired successfully.");
    } catch (err) {
      console.error("Error expiring policy:", err);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto mt-10 p-6 shadow-md">
      <CardContent>
        <h1 className="text-xl font-semibold mb-12">
          Withdraw Coverage of Unbought/Expired Policies
        </h1>

        <div className="mb-4">
          <Label htmlFor="policyId" className="text-xl">
            Policy ID
          </Label>
          <Input
            id="policyId"
            type="text"
            value={policyId}
            onChange={(e) => setPolicyId(e.target.value)}
            placeholder="Enter Your Policy ID"
            className="mt-2"
          />
        </div>

        <Button onClick={handleSubmit} className="w-1/3 mt-4 cursor-pointer">
          Withdraw Coverage
        </Button>
      </CardContent>
    </Card>
  );
}
