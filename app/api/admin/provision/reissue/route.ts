import { type NextRequest } from "next/server";
import { handleReissue } from "@/src/_app/api-routes/admin/provision";

export const dynamic = "force-dynamic";

export const POST = (req: NextRequest) => handleReissue(req);
