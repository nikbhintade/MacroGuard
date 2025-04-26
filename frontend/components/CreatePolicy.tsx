"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { flareTestnet } from "viem/chains";
import contractJson from "@/abi/macroguard.json";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { parseUnits } from "viem";

const contractAddress = "0xec4774B4F26cD511b8545348D4Bb00a1Ad9b44B9";
const contractAbi = contractJson.abi;

export default function CreatePolicy() {
  const { account: userAddress, client } = useWalletConnection();

  const [formData, setFormData] = useState({
    indicator: "",
    increase: "",
    strikePrice: "",
    coverage: "",
    premium: "",
    numberOfPolicies: "",
    startDate: "",
    endDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const {
      premium,
      numberOfPolicies,
      coverage,
      strikePrice,
      startDate,
      endDate,
      indicator,
      increase,
    } = formData;

    const startDateUnix = Math.floor(new Date(startDate).getTime() / 1000);
    const endDateUnix = Math.floor(new Date(endDate).getTime() / 1000);
    const period = endDateUnix - startDateUnix;
    const isHigher = increase === "Higher";

    try {
      if (!client || !userAddress) {
        throw new Error("Wallet client or user address not found.");
      }

      await client.writeContract({
        account: userAddress,
        address: contractAddress, // Replace with actual address
        abi: contractAbi, // Replace with actual ABI
        functionName: "createPolicy",
        chain: flareTestnet, // Replace with actual chain
        args: [
          parseUnits(premium, 18),
          BigInt(numberOfPolicies),
          parseUnits(coverage, 18),
          BigInt(Number(strikePrice) * 1_000_000),
          BigInt(startDateUnix),
          BigInt(period),
          isHigher,
          indicator,
        ],
      });

      console.log("Policy Created.");
    } catch (err) {
      console.error("Error creating policy:", err);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 shadow-md space-y-4">
      <h1 className="text-2xl font-semibold">Enter Policy Information</h1>

      <div className="space-y-2">
        <Label htmlFor="indicator">Indicator</Label>
        <Select
          onValueChange={(value) => handleSelectChange("indicator", value)}
          value={formData.indicator}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Indicator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GDP">GDP</SelectItem>
            <SelectItem value="CPI">CPI</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="strikePrice">Strike Price</Label>
        <Input
          id="strikePrice"
          name="strikePrice"
          type="number"
          value={formData.strikePrice}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="increase">Higher/Lower</Label>
        <Select
          onValueChange={(value) => handleSelectChange("increase", value)}
          value={formData.increase}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Increase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Lower">Lower</SelectItem>
            <SelectItem value="Higher">Higher</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverage">Coverage</Label>
        <Input
          id="coverage"
          name="coverage"
          type="number"
          value={formData.coverage}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="premium">Premium</Label>
        <Input
          id="premium"
          name="premium"
          type="number"
          value={formData.premium}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="numberOfPolicies">Number of Policies</Label>
        <Input
          id="numberOfPolicies"
          name="numberOfPolicies"
          type="number"
          value={formData.numberOfPolicies}
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
          />
        </div>
      </div>

      <Button className="w-full mt-4" onClick={handleSubmit}>
        Create Policy
      </Button>
    </div>
  );
}
