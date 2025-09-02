import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashStep {
  name: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface FlashCardProps {
  canFlash: boolean;
  isFlashing: boolean;
  progress: number;
  steps: FlashStep[];
  logs: string[];
  onFlash: () => void;
  onReset: () => void;
  error?: string;
  completed?: boolean;
  flashStats?: {
    chip: string;
    baudRate: number;
    fileSize: number;
    duration: number;
  };
}

export function FlashCard({ 
  canFlash, 
  isFlashing, 
  progress, 
  steps, 
  logs, 
  onFlash, 
  onReset,
  error,
  completed,
  flashStats
}: FlashCardProps) {
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="glass-card p-6">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            completed ? "bg-green-500/20 text-green-400" :
            error ? "bg-destructive/20 text-destructive" :
            isFlashing ? "bg-primary/20 text-primary animate-pulse-glow" :
            "bg-muted/50 text-muted-foreground"
          )}>
            {completed ? <CheckCircle className="h-5 w-5" /> :
             error ? <XCircle className="h-5 w-5" /> :
             <Zap className="h-5 w-5" />}
          </div>
          <div>
            <CardTitle className="text-lg">Flash</CardTitle>
            <CardDescription>
              {completed ? "Firmware flashed successfully!" :
               error ? "Flash failed" :
               isFlashing ? "Flashing in progress..." :
               "Ready to flash firmware"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            {isFlashing && (
              <span className="text-sm text-muted-foreground">
                {progress.toFixed(1)}%
              </span>
            )}
          </div>
          
          <Progress 
            value={progress} 
            variant="neon"
            className="h-2"
          />

          <div className="flex flex-wrap gap-2">
            {steps.map((step, index) => (
              <Badge
                key={index}
                variant={
                  step.status === 'completed' ? 'default' :
                  step.status === 'active' ? 'secondary' :
                  step.status === 'error' ? 'destructive' :
                  'outline'
                }
                className={cn(
                  "text-xs transition-all",
                  step.status === 'active' && "animate-pulse-glow",
                  step.status === 'completed' && "bg-primary/20 text-primary border-primary/30"
                )}
              >
                {step.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Activity Logs */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Activity log</h4>
            <ScrollArea className="h-32 w-full rounded-md border border-primary/20 bg-muted/20 p-3">
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, index) => (
                  <div key={index} className="text-muted-foreground">
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Flash Stats */}
        {completed && flashStats && (
          <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <h4 className="text-sm font-semibold text-primary">Flash Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Chip:</span>
                <span className="ml-2 font-mono">{flashStats.chip}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Baud:</span>
                <span className="ml-2 font-mono">{flashStats.baudRate}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Size:</span>
                <span className="ml-2 font-mono">{formatFileSize(flashStats.fileSize)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2 font-mono">{formatDuration(flashStats.duration)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {completed || error ? (
            <Button 
              variant="neon" 
              onClick={onReset}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Flash Again
            </Button>
          ) : (
            <Button 
              variant="neon" 
              onClick={onFlash}
              disabled={!canFlash || isFlashing}
              className="flex-1"
            >
              {isFlashing ? "Flashing..." : "Flash Firmware"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}