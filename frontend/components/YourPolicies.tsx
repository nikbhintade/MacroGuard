"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPublicClient, formatEther, http } from "viem";
import { flareTestnet } from "viem/chains";
import contractJson from "@/abi/macroguard.json";
import { useWalletConnection } from "@/hooks/useWalletConnection";

const contractAddress = "0xec4774B4F26cD511b8545348D4Bb00a1Ad9b44B9";
const contractAbi = contractJson.abi;

const publicClient = createPublicClient({
  chain: flareTestnet,
  transport: http(),
});

type Policy = {
  id: bigint;
  provider: `0x${string}`;
  premium: bigint;
  coverage: bigint;
  status: number;
  strikePrice: bigint;
  startDate: bigint;
  endDate: bigint;
  currentSupply: bigint;
  totalSupply: bigint;
  indicator: string;
  isHigher: boolean;
};

export default function YourPolicies() {
  const { account: userAddress, client } = useWalletConnection();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [allowance, setAllowance] = useState<bigint>(BigInt(0)); // Placeholder
  const [balances, setBalances] = useState<bigint[]>([]);

  const fetchBalances = async (userAddress: `0x${string}`) => {
    console.log("Fetching balances...");
    if (!userAddress) return;

    try {
      const currentId = (await publicClient.readContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: "getCurrentPolicyId",
      })) as bigint;

      const idNum = Number(currentId);

      const balances = await Promise.all(
        Array.from({ length: idNum }, (_, i) =>
          publicClient.readContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: "balanceOf",
            args: [userAddress, BigInt(i)],
          })
        )
      );

      console.log("User balances per policy:", balances);
      setBalances(balances as bigint[]);
    } catch (err) {
      console.error("Error fetching balances:", err);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!userAddress) return;

      try {
        const currentId = (await publicClient.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: "getCurrentPolicyId",
        })) as bigint;

        const idNum = Number(currentId);

        // Fetch all policies
        const policies = (await Promise.all(
          Array.from({ length: idNum }, (_, i) =>
            publicClient.readContract({
              address: contractAddress,
              abi: contractAbi,
              functionName: "getPolicy",
              args: [BigInt(i)],
            })
          )
        )) as Policy[];

        // Fetch all balances
        const balances = (await Promise.all(
          Array.from({ length: idNum }, (_, i) =>
            publicClient.readContract({
              address: contractAddress,
              abi: contractAbi,
              functionName: "balanceOf",
              args: [userAddress, BigInt(i)],
            })
          )
        )) as bigint[];

        // Filter policies where balance > 0
        const filteredPolicies = policies.filter(
          (_, idx) => balances[idx] > BigInt(0)
        );

        setPolicies(filteredPolicies);
        setBalances(balances.filter((balance) => balance > BigInt(0)));
      } catch (err) {
        console.error("Error fetching data:", err);
        setPolicies([]);
        setBalances([]);
      }
    };

    fetchData();
  }, [userAddress]);

  const redeemPolicy = async (policyId: bigint) => {
    try {
      if (!client) {
        throw new Error("Wallet client could not be created");
      }
      if (!userAddress) {
        throw new Error("Wallet client could not be created");
      }

      await client.writeContract({
        account: userAddress,
        address: contractAddress,
        abi: contractAbi,
        functionName: "redeemPolicy",
        chain: flareTestnet,
        args: [policyId], // Adjust the amount as needed
      });
      console.log("Policy Redeemed.");
    } catch (err) {
      console.error("Error approving token:", err);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 py-6">
      {policies.map((policy, index) => (
        <Card
          key={index}
          className="bg-black border border-gray-700 text-white flex flex-col overflow-hidden p-0"
        >
          <CardContent className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <CardTitle className="text-xl mb-1">
                {policy.indicator} @ {Number(policy.strikePrice) / 1_000_000}{" "}
                {policy.isHigher ? "or Higher" : "or Lower"}
              </CardTitle>

              <CardDescription className="text-sm text-gray-100 mb-1">
                By {policy.provider.slice(0, 5)}....{policy.provider.slice(-5)}
              </CardDescription>

              <p className="text-sm text-gray-100 mb-1">
                You own: {balances[index]?.toString() ?? "0"}{" "}
                {balances[index] > 1 ? "policies" : "policy"}
              </p>
              <p className="text-sm text-gray-100 mb-3">
                Policy ID: {policy.id}
              </p>
            </div>

            {policy.status == 1 ? (
              <Button
                onClick={() => redeemPolicy(policy.id)}
                className="cursor-pointer"
              >
                Redeem Policy
              </Button>
            ) : (
              <Button className="cursor-pointer" disabled>
                Redeem Policy
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
