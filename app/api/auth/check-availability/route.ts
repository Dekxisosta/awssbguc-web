import { type NextRequest } from "next/server";
import { handleCheckAvailability } from "@/src/_app/api-routes/auth/check-availability";

export const POST = (req: NextRequest) => handleCheckAvailability(req);
