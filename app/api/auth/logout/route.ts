import { type NextRequest } from "next/server";
import { handleLogout } from "@/src/_app/api-routes/auth/logout";

export const POST = (req: NextRequest) => handleLogout(req);
