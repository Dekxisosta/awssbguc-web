import { type NextRequest } from "next/server";
import { handleReviewRequest } from "@/src/_app/api-routes/admin/student-data-requests";

export const dynamic = "force-dynamic";

export const PATCH = async (
  req: NextRequest,
  ctx: { params: Promise<{ requestId: string }> | { requestId: string } }
) => {
  const { requestId } = await ctx.params;
  return handleReviewRequest(requestId, req);
};
