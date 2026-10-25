import { type NextRequest } from "next/server";
import { handlePersonDetail } from "@/src/_app/api-routes/admin/people";

export const dynamic = "force-dynamic";

// `params` is a Promise on Next 15+, a plain object before — awaiting handles both.
export const GET = async (
  _req: NextRequest,
  ctx: { params: Promise<{ participantId: string }> | { participantId: string } }
) => {
  const { participantId } = await ctx.params;
  return handlePersonDetail(participantId);
};
