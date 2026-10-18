import { BottomNav, SideNav } from "@/components/admin/nav";
import { RegisterSW } from "@/components/admin/push-toggle";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-svh">
      <SideNav role={user.role} name={user.name} />
      <main className="mx-auto w-full max-w-3xl pt-[env(safe-area-inset-top)] pb-28 lg:px-8 lg:pb-12">{children}</main>
      <BottomNav role={user.role} />
      <RegisterSW />
    </div>
  );
}
