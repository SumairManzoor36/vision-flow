"use client";

import * as React from "react";
import { Camera, RefreshCcw, SwitchCamera, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type FacingMode = "environment" | "user";

export function CameraCapture({
  onCapture,
  onCancel,
}: {
  onCapture: (dataUrl: string) => void;
  onCancel?: () => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [facing, setFacing] = React.useState<FacingMode>("environment");

  const start = React.useCallback(async (mode: FacingMode) => {
    setError(null);
    setReady(false);

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Camera API not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setReady(true);
      }
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.name === "NotAllowedError"
            ? "Camera permission was denied. Enable it in your browser settings."
            : e.message
          : "Could not start camera";
      setError(msg);
    }
  }, []);

  React.useEffect(() => {
    start(facing);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  function snap() {
    const video = videoRef.current;
    if (!video || !ready) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      toast.error("Camera frame not available yet");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onCapture(dataUrl);
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="block aspect-video w-full bg-black object-cover"
        />

        {/* Camera viewfinder overlay */}
        {ready && (
          <>
            <div className="pointer-events-none absolute inset-4 rounded-lg border-2 border-white/40" />
            <div className="pointer-events-none absolute left-6 top-6 h-6 w-6 border-l-2 border-t-2 border-brand-400" />
            <div className="pointer-events-none absolute right-6 top-6 h-6 w-6 border-r-2 border-t-2 border-brand-400" />
            <div className="pointer-events-none absolute bottom-6 left-6 h-6 w-6 border-b-2 border-l-2 border-brand-400" />
            <div className="pointer-events-none absolute bottom-6 right-6 h-6 w-6 border-b-2 border-r-2 border-brand-400" />
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              Align inventory inside the frame
            </div>
          </>
        )}

        {/* Loading / Error state */}
        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-sm text-white">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <p>Starting camera…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 px-6 text-center text-sm text-white">
            <Camera className="h-8 w-8 text-destructive" />
            <p className="font-medium">{error}</p>
            <Button size="sm" variant="outline" onClick={() => start(facing)}>
              <RefreshCcw className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        )}

        {/* Switch camera button (top right) */}
        {ready && (
          <button
            type="button"
            onClick={() => setFacing(facing === "environment" ? "user" : "environment")}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80"
            aria-label="Switch camera"
          >
            <SwitchCamera className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {onCancel ? (
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4" /> Cancel
          </Button>
        ) : (
          <span />
        )}
        <Button
          variant="gradient"
          size="lg"
          onClick={snap}
          disabled={!ready}
          className="min-w-[160px]"
        >
          <Camera className="h-4 w-4" /> Capture
        </Button>
      </div>
    </div>
  );
}
