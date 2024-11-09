import { Card, CardContent } from "~/components/ui/card";

export function Visualizer({
  clientCanvasRef,
  serverCanvasRef
}: {
  clientCanvasRef: React.RefObject<HTMLCanvasElement>;
  serverCanvasRef: React.RefObject<HTMLCanvasElement>;
}) {
  return (
    <Card>
      <CardContent className="flex gap-4 p-4">
        <div className="flex-1 h-24 relative">
          <span className="absolute -top-6 left-2 text-sm text-muted-foreground">Input</span>
          <canvas ref={clientCanvasRef} className="w-full h-full" />
        </div>
        <div className="flex-1 h-24 relative">
          <span className="absolute -top-6 left-2 text-sm text-muted-foreground">Output</span>
          <canvas ref={serverCanvasRef} className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  );
}
