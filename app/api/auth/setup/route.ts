import { type NextRequest } from "next/server";
import { handleSetup } from "@/src/_app/api-routes/auth/setup";

export const POST = (req: NextRequest) => handleSetup(req);
