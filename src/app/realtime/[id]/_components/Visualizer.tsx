import { Card, CardContent } from "~/components/ui/card";

export function Visualizer({
  clientCanvasRef,
  serverCanvasRef
}: {
  clientCanvasRef: React.RefObject<HTMLCanvasElement>;
  serverCanvasRef: React.RefObject<HTMLCanvasElement>;
}) {
  return (
    <div className="relative h-10 w-full">
      {/* Container for both visualizers */}
      <div className="absolute inset-0 rounded-md overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-500/5 to-neutral-500/10" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:16px_16px]" />

        {/* Client visualization (back layer) */}
        <div className="absolute inset-0">
          <canvas
            ref={clientCanvasRef}
            className="w-full h-full [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.2))',
              opacity: 0.5
            }}
          />
        </div>

        {/* Server visualization (front layer) */}
        <div className="absolute inset-0">
          <canvas
            ref={serverCanvasRef}
            className="w-full h-full [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.2))',
              opacity: 0.5
            }}
          />
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 bg-white/[0.02]" />
      </div>
    </div>
  );
}
