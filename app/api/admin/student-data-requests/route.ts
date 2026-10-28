import { type NextRequest } from "next/server";
import { handleListRequests } from "@/src/_app/api-routes/admin/student-data-requests";

export const dynamic = "force-dynamic";

export const GET = (req: NextRequest) => handleListRequests(req);
