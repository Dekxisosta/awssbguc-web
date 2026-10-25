import { type NextRequest } from "next/server";
import { handlePending } from "@/src/_app/api-routes/admin/provision";

export const dynamic = "force-dynamic";

export const GET = (req: NextRequest) => handlePending(req);
