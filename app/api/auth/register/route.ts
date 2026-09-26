import { type NextRequest } from "next/server";
import { handleRegister } from "@/src/_app/api-routes/auth/register";

export const POST = (req: NextRequest) => handleRegister(req);
