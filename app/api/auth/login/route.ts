import { type NextRequest } from "next/server";
import { handleLogin } from "@/src/_app/api-routes/auth/login";

export const POST = (req: NextRequest) => handleLogin(req);
