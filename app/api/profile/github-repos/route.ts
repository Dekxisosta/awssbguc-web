import { handleGithubRepoList } from "@/src/_app/api-routes/profile/repos";

export const dynamic = "force-dynamic";

export const GET = () => handleGithubRepoList();
