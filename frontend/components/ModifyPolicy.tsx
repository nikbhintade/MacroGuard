"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PolicyForm() {
  const [policyId, setPolicyId] = useState("");

  const handleSubmit = () => {
    console.log("Policy ID:", policyId);
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
