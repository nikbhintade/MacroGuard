"use client";

import Image from "next/image";
import cardData from "@/data/your-policies.json";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function YourPolicies() {
  const router = useRouter();

  return (
    <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 py-6">
      {cardData.map((card) => (
        <Card
          key={card.id}
          className="bg-black border border-gray-700 text-white flex flex-col overflow-hidden p-0"
        >
          <CardHeader className="p-0">
            <Image
              src={card.image}
              alt={card.title}
              width={600}
              height={300}
              className="rounded-t-lg w-full object-cover"
            />
          </CardHeader>

          <CardContent className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <CardTitle className="text-xl mb-1">{card.title}</CardTitle>
              <CardDescription className="text-sm text-gray-300 mb-1">
                {card.subtitle}
              </CardDescription>
              <p className="text-gray-300 mb-3">{card.description}</p>
            </div>

            <Button
              onClick={() => router.push(card.buttonLink)}
              className="cursor-pointer"
            >
              {card.buttonText}
            </Button>
            {/* <Link
              href={card.buttonLink}
              className="mt-auto inline-block bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition text-center"
            >
              {card.buttonText}
            </Link> */}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
