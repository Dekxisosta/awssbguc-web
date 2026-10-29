import { type NextRequest } from "next/server";
import { handleRepoImageDelete } from "@/src/_app/api-routes/profile/repos";

export const dynamic = "force-dynamic";

export const DELETE = async (
  _req: NextRequest,
  ctx: { params: Promise<{ repoId: string; imageId: string }> | { repoId: string; imageId: string } },
) => {
  const { repoId, imageId } = await ctx.params;
  return handleRepoImageDelete(repoId, imageId);
};
