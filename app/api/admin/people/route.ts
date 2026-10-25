import { type NextRequest } from "next/server";
import { handlePeopleList } from "@/src/_app/api-routes/admin/people";

export const dynamic = "force-dynamic";

export const GET = (req: NextRequest) => handlePeopleList(req);
