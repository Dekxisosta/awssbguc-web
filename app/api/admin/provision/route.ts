import { type NextRequest } from "next/server";
import { handleProvision } from "@/src/_app/api-routes/admin/provision";

export const dynamic = "force-dynamic";
// Bulk provisioning + email can take a while.
export const maxDuration = 60;

export const POST = (req: NextRequest) => handleProvision(req);
