import { type NextRequest } from "next/server";
import { handleMemberLink } from "@/src/_app/api-routes/member/link";

export const POST = (req: NextRequest) => handleMemberLink(req);
