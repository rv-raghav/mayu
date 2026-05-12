import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  ChevronRight,
  Command,
  LayoutDashboard,
  LogOut,
  PlusSquare,
  Settings,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/layout/PageContainer";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/axios";

interface ProductShellProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

const primaryItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Poll Builder", icon: PlusSquare, href: "/polls/new" },
];

const secondaryItems = [
  { label: "Analytics", icon: BarChart3 },
  { label: "Audience", icon: Users2 },
  { label: "Settings", icon: Settings },
];

export function ProductShell({
  eyebrow = "Realtime workspace",
  title,
  description,
  actions,
  children,
}: ProductShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout transport issues and clear local auth anyway.
    } finally {
      clearAuth();
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-primary">
      <div className="grid min-h-screen lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[rgba(26,23,20,0.08)] bg-dark text-white lg:flex lg:flex-col">
          <div className="border-b border-white/8 px-6 py-6">
            <Link to="/dashboard" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-white">
                <Command className="h-5 w-5" />
              </span>
              <div>
                <p className="font-serif text-2xl tracking-tight text-white">MaYu</p>
                <p className="text-sm text-white/55">Premium polling studio</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-6">
            <p className="px-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/35">Workspace</p>
            <div className="mt-4 space-y-1.5">
              {primaryItems.map(({ label, icon: Icon, href }) => {
                const active =
                  location.pathname === href ||
                  (href === "/dashboard" && location.pathname.startsWith("/polls/") === false && location.pathname.includes("/analytics") === false);

                return (
                  <Link
                    key={label}
                    to={href}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-3 py-3 text-sm transition-colors",
                      active ? "bg-white/8 text-white" : "text-white/60 hover:bg-white/6 hover:text-white"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                );
              })}
            </div>

            <p className="mt-8 px-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/35">Signals</p>
            <div className="mt-4 space-y-1.5">
              {secondaryItems.map(({ label, icon: Icon }) => {
                const active = label === "Analytics" && location.pathname.includes("/analytics");

                return (
                  <div
                    key={label}
                    className={cn(
                      "flex items-center justify-between rounded-2xl px-3 py-3 text-sm",
                      active ? "bg-white/8 text-white" : "text-white/42"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/35">
                      Soon
                    </span>
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-white/8 px-4 py-4">
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/6 px-3 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-medium text-white">
                {user?.displayName?.charAt(0).toUpperCase() ?? "M"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{user?.displayName ?? "MaYu User"}</p>
                <p className="truncate text-xs text-white/45">{user?.email ?? "Signed in"}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-between border border-white/10 text-white hover:bg-white/8" onClick={handleLogout}>
              Leave workspace
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 border-b border-[rgba(26,23,20,0.06)] bg-primary/88 backdrop-blur-xl">
            <PageContainer size="wide" className="py-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
                  <div className="space-y-1">
                    <h1 className="text-3xl leading-tight sm:text-4xl">{title}</h1>
                    <p className="max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">{description}</p>
                  </div>
                </div>
                {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
              </div>
            </PageContainer>
          </header>

          <PageContainer size="wide" className="flex-1 py-8 sm:py-10">
            {children}
          </PageContainer>
        </div>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-40 rounded-[22px] border border-[rgba(26,23,20,0.08)] bg-white/92 p-2 shadow-large backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
            { label: "Build", icon: PlusSquare, href: "/polls/new" },
            { label: "Pulse", icon: Activity, href: location.pathname.includes("/analytics") ? location.pathname : "/dashboard" },
            { label: "More", icon: BarChart3, href: "/dashboard" },
          ].map(({ label, icon: Icon, href }) => {
            const active =
              location.pathname === href || (label === "Pulse" && location.pathname.includes("/analytics"));

            return (
              <Link
                key={label}
                to={href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium",
                  active ? "bg-secondary text-text-primary" : "text-text-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
