import { ParticipantQRCode } from "@/src/widgets/participant-qrcode";

export const qrMetadata = { title: "My QR Code — AWSSBG-UC" };

interface QRPageProps {
  participantId: string | null;
  displayName: string | null;
  qrToken: string | null;
}

export function QRPage({ participantId, displayName, qrToken }: QRPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">My QR Code</h1>
        <p className="mt-1.5 text-sm text-neutral-400">
          Show this code at event check-in.
        </p>
      </div>

      {qrToken ? (
        <div className="flex flex-col items-center gap-6">
          <ParticipantQRCode token={qrToken} size={260} />
          <div className="w-full max-w-xs rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-center">
            {displayName && (
              <p className="text-sm font-medium text-neutral-100">{displayName}</p>
            )}
            {participantId && (
              <p className="mt-1 text-xs text-neutral-500">
                Participant ID: {participantId.slice(0, 8)}
              </p>
            )}
          </div>
          <p className="max-w-xs text-center text-xs text-neutral-600">
            Do not share this QR code. It uniquely identifies you at events.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-10 text-center">
          <p className="text-sm text-neutral-400">
            No participant record is linked to your account yet.
          </p>
          <p className="mt-2 text-xs text-neutral-600">
            Contact an administrator if you believe this is an error.
          </p>
        </div>
      )}
    </div>
  );
}
