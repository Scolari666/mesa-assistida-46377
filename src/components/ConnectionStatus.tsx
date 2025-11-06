import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected';
  onReconnect: () => void;
}

export const ConnectionStatus = ({ status, onReconnect }: ConnectionStatusProps) => {
  if (status === 'connected') {
    return (
      <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10">
        <Wifi className="h-3 w-3 mr-1" />
        Conectado
      </Badge>
    );
  }

  if (status === 'connecting') {
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-500 bg-yellow-500/10">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Conectando...
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="border-red-500 text-red-500 bg-red-500/10">
        <WifiOff className="h-3 w-3 mr-1" />
        Desconectado
      </Badge>
      <Button size="sm" variant="outline" onClick={onReconnect}>
        Reconectar
      </Button>
    </div>
  );
};
