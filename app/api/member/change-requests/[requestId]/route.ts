import { type NextRequest } from "next/server";
import { handleCancelChangeRequest } from "@/src/_app/api-routes/member/change-request";

export const dynamic = "force-dynamic";

// `params` is a Promise on Next 15+, a plain object before — awaiting handles both.
export const DELETE = async (
  _req: NextRequest,
  ctx: { params: Promise<{ requestId: string }> | { requestId: string } }
) => {
  const { requestId } = await ctx.params;
  return handleCancelChangeRequest(requestId);
};
