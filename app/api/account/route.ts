import { type NextRequest } from "next/server";
import { handleScheduleAccountDeletion } from "@/src/_app/api-routes/account/delete";

export const DELETE = (req: NextRequest) => handleScheduleAccountDeletion(req);
