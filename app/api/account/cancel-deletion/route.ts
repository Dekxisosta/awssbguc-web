import { type NextRequest } from "next/server";
import { handleCancelAccountDeletion } from "@/src/_app/api-routes/account/delete";

export const POST = (req: NextRequest) => handleCancelAccountDeletion(req);
