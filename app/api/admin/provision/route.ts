import { type NextRequest } from "next/server";
import { handleProvision } from "@/src/_app/api-routes/admin/provision";

export const POST = (req: NextRequest) => handleProvision(req);
