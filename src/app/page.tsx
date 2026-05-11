import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function Home() {
  // Auth gate: if logged in, go to forms; otherwise /login.
  await requireUser();
  redirect("/forms");
}
