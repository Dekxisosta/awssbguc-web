import { type NextRequest } from "next/server";
import { handleRepoAdd } from "@/src/_app/api-routes/profile/repos";

export const dynamic = "force-dynamic";

export const POST = (req: NextRequest) => handleRepoAdd(req);
