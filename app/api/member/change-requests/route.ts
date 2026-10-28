import { type NextRequest } from "next/server";
import { handleCreateChangeRequest } from "@/src/_app/api-routes/member/change-request";

export const dynamic = "force-dynamic";

export const POST = (req: NextRequest) => handleCreateChangeRequest(req);
