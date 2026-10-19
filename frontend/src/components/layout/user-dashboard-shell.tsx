"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { apiError, isAccountNotification } from "@/types/account-data";

const navigation = [
  { label: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mes projets", href: "/dashboard/projects", icon: FolderKanban },
  { label: "Candidatures", href: "/dashboard/applications", icon: BriefcaseBusiness },
  { label: "Documents", href: "/dashboard/documents", icon: FileText },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
];

const accountNavigation = [
  { label: "Mon profil", href: "/dashboard/profile", icon: UserRound },
  { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
];
type NavigationItem = { label: string; href: string; icon: LucideIcon };

export function UserDashboardShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [notificationError, setNotificationError] = useState("");
  const initials =
    user?.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ?? "";

  useEffect(() => {
    let active = true;
    async function loadUnreadCount() {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        const body: unknown = await response.json();
        if (!response.ok) throw new Error(apiError(body, "Impossible de charger le nombre de notifications."));
        if (!Array.isArray(body) || !body.every(isAccountNotification)) {
          throw new Error("La réponse du serveur pour les notifications est invalide.");
        }
        if (active) {
          setUnreadCount(body.filter((item) => !item.readAt).length);
          setNotificationError("");
        }
      } catch (error) {
        if (active) setNotificationError(error instanceof Error ? error.message : "Impossible de charger le nombre de notifications.");
      }
    }
    void loadUnreadCount();
    window.addEventListener("afrilauch:notifications-updated", loadUnreadCount);
    return () => {
      active = false;
      window.removeEventListener("afrilauch:notifications-updated", loadUnreadCount);
    };
  }, []);

  async function handleLogout() {
    setLogoutError("");
    try {
      await logout();
      router.replace("/login");
    } catch {
      setLogoutError("La déconnexion a échoué. Réessayez.");
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || !searchValue.trim()) return;
    router.push(`/dashboard/projects?search=${encodeURIComponent(searchValue.trim())}`);
  }

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderNavigation(items: NavigationItem[]) {
    return items.map(({ label, href, icon: Icon }) => (
      <Link
        className={isActive(href) ? "user-nav-link is-active" : "user-nav-link"}
        href={href}
        key={href}
        aria-current={isActive(href) ? "page" : undefined}
        onClick={closeMenu}
      >
        <Icon size={18} strokeWidth={1.8} />
        <span>{label}</span>
        {label === "Notifications" && unreadCount !== null && unreadCount > 0 && <i className="user-nav-count">{unreadCount}</i>}
      </Link>
    ));
  }

  return (
    <div className="user-dashboard">
      <aside className={menuOpen ? "user-sidebar is-open" : "user-sidebar"}>
        <div className="user-sidebar__brand-row">
          <Link className="dashboard-brand" href="/" aria-label="AfriLaunch, accueil">
            <span>afri</span>launch<i />
          </Link>
          <button className="user-sidebar__close" type="button" aria-label="Fermer le menu" onClick={closeMenu}>
            <X size={19} />
          </button>
        </div>

        <div className="user-workspace">
          <span className="user-workspace__mark">A</span>
          <span><strong>Espace fondateur</strong><small>Compte personnel</small></span>
          <ChevronDown size={15} />
        </div>

        <nav className="user-sidebar__nav" aria-label="Navigation de l'espace utilisateur">
          {notificationError && <p role="alert">{notificationError}</p>}
          <span className="user-nav-label">ESPACE DE TRAVAIL</span>
          {renderNavigation(navigation)}
          <span className="user-nav-label user-nav-label--account">MON COMPTE</span>
          {renderNavigation(accountNavigation)}
        </nav>

        <div className="user-sidebar__bottom">
          <div className="sidebar-profile">
            <span className="user-avatar">{initials}</span>
            <span><strong>{user?.name}</strong><small>{user?.email}</small></span>
            <ChevronDown size={15} />
          </div>
          {logoutError && <p role="alert">{logoutError}</p>}
          <button className="sidebar-logout" type="button" onClick={handleLogout}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {menuOpen && <button className="user-sidebar-backdrop" aria-label="Fermer la navigation" onClick={closeMenu} />}

      <div className="user-dashboard__main">
        <header className="user-topbar">
          <button className="user-mobile-menu" type="button" aria-label="Ouvrir la navigation" onClick={() => setMenuOpen(true)}>
            <Menu size={21} />
          </button>
          <div className="user-topbar__search">
            <Search size={17} />
            <input type="search" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} onKeyDown={handleSearchKeyDown} placeholder="Rechercher un projet..." aria-label="Rechercher un projet dans votre espace" />
            <kbd>⌘ K</kbd>
          </div>
          <div className="user-topbar__actions">
            <Link className="user-topbar__notification" href="/dashboard/notifications" aria-label={unreadCount === null ? "Notifications" : `Notifications, ${unreadCount} non lues`}>
              <Bell size={19} />{unreadCount !== null && unreadCount > 0 && <i />}
            </Link>
            <span className="user-topbar__divider" />
            <Link className="user-topbar__profile" href="/dashboard/profile">
              <span className="user-avatar">{initials}</span>
              <span><strong>{user?.name}</strong><small>{user?.role === "ADMIN" ? "Administrateur" : "Utilisateur"}</small></span>
              <ChevronDown size={15} />
            </Link>
          </div>
        </header>
        <main className="user-page-content">{children}</main>
      </div>
    </div>
  );
}
