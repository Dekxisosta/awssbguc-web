import { type NextRequest } from "next/server";
import { handleRepoDelete, handleRepoUpdate } from "@/src/_app/api-routes/profile/repos";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ repoId: string }> | { repoId: string } };

// `params` is a Promise on Next 15+, a plain object before: awaiting handles both.
export const PATCH = async (req: NextRequest, ctx: Ctx) => handleRepoUpdate(req, (await ctx.params).repoId);
export const DELETE = async (_req: NextRequest, ctx: Ctx) => handleRepoDelete((await ctx.params).repoId);
