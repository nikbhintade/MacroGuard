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

export default function CreatePolicy() {
  const [formData, setFormData] = useState({
    indicator: "",
    trigger: "",
    increase: "",
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

  const handleSubmit = () => {
    console.log("Form Data:", formData);
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
            <SelectItem value="Indicator A">Indicator A</SelectItem>
            <SelectItem value="Indicator B">Indicator B</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="trigger">Trigger</Label>
        <Select
          onValueChange={(value) => handleSelectChange("trigger", value)}
          value={formData.trigger}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Trigger" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Trigger X">Trigger X</SelectItem>
            <SelectItem value="Trigger Y">Trigger Y</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="increase">Increase</Label>
        <Select
          onValueChange={(value) => handleSelectChange("increase", value)}
          value={formData.increase}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Increase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="High">High</SelectItem>
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
