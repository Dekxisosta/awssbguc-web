import { type NextRequest } from "next/server";
import { handleRepoImageUpload } from "@/src/_app/api-routes/profile/repos";

export const dynamic = "force-dynamic";

export const POST = async (
  req: NextRequest,
  ctx: { params: Promise<{ repoId: string }> | { repoId: string } },
) => handleRepoImageUpload(req, (await ctx.params).repoId);
