import { type NextRequest } from "next/server";
import { handleProfileUpdate } from "@/src/_app/api-routes/profile/update";

export const PATCH = (req: NextRequest) => handleProfileUpdate(req);
