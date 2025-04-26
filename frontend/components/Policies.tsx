"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { createPublicClient, formatEther, http, parseUnits } from "viem";
import { flareTestnet } from "viem/chains";
import contractJson from "@/abi/macroguard.json";
import tokenJson from "@/abi/token.json";
import { useWalletConnection } from "@/hooks/useWalletConnection";

const contractAddress = "0xec4774B4F26cD511b8545348D4Bb00a1Ad9b44B9";
const contractAbi = contractJson.abi;
const tokenAddress = "0xeEf81df5961036265a336431232506824DcA9488";
const tokenAbi = tokenJson.abi;

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

export default function Policies() {
  const { account, client } = useWalletConnection();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));

  useEffect(() => {
    const fetchPolicies = async () => {
      console.log("Fetching policies...");
      try {
        const currentId = (await publicClient.readContract({
          address: contractAddress,
          abi: contractAbi,
          functionName: "getCurrentPolicyId",
        })) as bigint;

        const idNum = Number(currentId);

        const results = await Promise.all(
          Array.from({ length: idNum }, (_, i) =>
            publicClient.readContract({
              address: contractAddress,
              abi: contractAbi,
              functionName: "getPolicy",
              args: [BigInt(i)],
            })
          )
        );

        setPolicies(results as Policy[]);
      } catch (err) {
        console.error("Error fetching policies:", err);
      }
    };

    if (account) {
      // Fetch the allowance if wallet is connected
      const fetchAllowance = async () => {
        try {
          const tokenClient = createPublicClient({
            chain: flareTestnet,
            transport: http(),
          });

          const allowance = await tokenClient.readContract({
            address: tokenAddress,
            abi: tokenAbi,
            functionName: "allowance",
            args: [account, contractAddress], // Check allowance to the Macro Guard contract
          });

          setAllowance(allowance as bigint); // Set the allowance
        } catch (err) {
          console.error("Error fetching allowance:", err);
        }
      };

      if (account) {
        fetchAllowance();
      }
    }

    fetchPolicies();
  }, [account]);

  const handleApprove = async () => {
    // const [account] = await client.getAddresses();
    try {
      if (!client) {
        throw new Error("Wallet client could not be created");
      }
      if (!account) {
        throw new Error("Wallet client could not be created");
      }

      await client.writeContract({
        account: account,
        address: tokenAddress,
        abi: tokenAbi,
        functionName: "approve",
        chain: flareTestnet,
        args: [contractAddress, parseUnits("100000", 18)], // Adjust the amount as needed
      });
      console.log("Token approved successfully.");
      setAllowance(BigInt(1_000_000_000)); // Update allowance after approval
    } catch (err) {
      console.error("Error approving token:", err);
    }
  };

  const handleBuyPolicy = async (policyId: bigint, premium: bigint) => {
    // Call the buyPolicy function on the Macro Guard contract
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
        functionName: "buyPolicy",
        chain: flareTestnet,
        args: [policyId],
      });
      console.log("Policy bought successfully.");
    } catch (err) {
      console.error("Error buying policy:", err);
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

              <CardDescription className="text-sm text-gray-300 mb-1">
                By {policy.provider.slice(0, 5)}....{policy.provider.slice(-5)}
              </CardDescription>

              <p className="text-gray-300 mb-3">
                {Number(policy.currentSupply)} / {Number(policy.totalSupply)}
              </p>
            </div>

            <Button
              onClick={() => {
                if (allowance >= BigInt(100_000)) {
                  handleBuyPolicy(policy.id, policy.premium);
                } else {
                  handleApprove();
                }
              }}
              className="cursor-pointer"
            >
              {allowance >= BigInt(100_000)
                ? `Buy @ ${formatEther(policy.premium)} USDT`
                : "Approve Token"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
