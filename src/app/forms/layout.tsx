import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { FormsUserProvider } from "@/app/forms/FormsUserContext";
import FormsBoardNav from "@/app/forms/FormsBoardNav";

export default async function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <Suspense
          fallback={
            <div className="mx-auto h-11 w-full max-w-none px-4 sm:px-6 lg:px-10" />
          }
        >
          <FormsBoardNav isAdmin={user.role === "ADMIN"} />
        </Suspense>
      </header>

      <main className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-4">
        <FormsUserProvider userId={user.id}>{children}</FormsUserProvider>
      </main>
    </div>
  );
}
