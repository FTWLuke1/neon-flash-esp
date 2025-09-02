import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Usb, Wifi, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceCardProps {
  isConnected: boolean;
  deviceInfo?: {
    chip: string;
    port: string;
    mac?: string;
  };
  onConnect: () => Promise<void>;
  connecting: boolean;
  error?: string;
}

export function DeviceCard({ isConnected, deviceInfo, onConnect, connecting, error }: DeviceCardProps) {
  return (
    <Card className={cn(
      "glass-card p-6 transition-all duration-300",
      error && "border-destructive/50 shadow-[0_0_20px_hsl(var(--destructive)/0.3)]"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            isConnected ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
          )}>
            <Usb className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Device</CardTitle>
            <CardDescription>
              {isConnected ? "Connected and ready" : "Click Connect to auto-detect your ESP"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {isConnected && deviceInfo ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Detected:</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Wifi className="h-3 w-3 mr-1" />
                {deviceInfo.chip}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Port:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {deviceInfo.port}
              </code>
            </div>
            {deviceInfo.mac && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">MAC:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {deviceInfo.mac}
                </code>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              No device connected. Make sure your ESP is plugged in via USB.
            </p>
            <Button 
              variant="connect" 
              onClick={onConnect}
              disabled={connecting}
              className="w-full"
            >
              {connecting ? "Connecting..." : "Connect"}
            </Button>
          </div>
        )}

        {isConnected && (
          <Button 
            variant="outline" 
            onClick={onConnect}
            disabled={connecting}
            className="w-full"
          >
            Reconnect
          </Button>
        )}
      </CardContent>
    </Card>
  );
}