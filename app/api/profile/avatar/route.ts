import { type NextRequest } from "next/server";
import { handleAvatarUpload, handleAvatarDelete } from "@/src/_app/api-routes/profile/avatar";

export const POST   = (req: NextRequest) => handleAvatarUpload(req);
export const DELETE = (req: NextRequest) => handleAvatarDelete(req);
