import { useWalletConnection } from "@/hooks/useWalletConnection";
import { Button } from "@/components/ui/button";

export default function ConnectWallet() {
  const { account, connectWallet, disconnectWallet } = useWalletConnection();

  return (
    <Button
      onClick={account ? disconnectWallet : connectWallet}
      className="cursor-pointer"
    >
      {account
        ? `${account.slice(0, 5)}...${account.slice(-5)}`
        : "Connect Wallet"}
    </Button>
  );
}
