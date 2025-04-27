import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ConnectWallet from "./ConnectWallet";

export default function NotConnected() {
  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-lg text-center rounded-2xl shadow-xl p-6">
        <CardContent>
          <h1 className="text-2xl font-semibold mb-4">
            You Wallet is not Connected
          </h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to proceed.
          </p>
        </CardContent>
        <CardFooter className="mx-auto">
          <ConnectWallet />
        </CardFooter>
      </Card>
    </div>
  );
}
