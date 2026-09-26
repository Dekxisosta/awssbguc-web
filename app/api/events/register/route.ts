import { type NextRequest } from "next/server";
import { handleEventRegister, handleEventUnregister } from "@/src/_app/api-routes/events/register";

export const POST   = (req: NextRequest) => handleEventRegister(req);
export const DELETE = (req: NextRequest) => handleEventUnregister(req);
