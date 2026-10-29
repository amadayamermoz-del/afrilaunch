"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Tags,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { apiError, isAccountNotification, type AccountNotification } from "@/types/account-data";

type Section = "dashboard" | "users" | "projects" | "applications" | "categories" | "opportunities" | "settings";
type UserRole = "USER" | "ADMIN";
type AccountStatus = "ACTIVE" | "SUSPENDED";
type ProjectStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED";
type ApplicationStatus = "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
type OpportunityStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

type AdminUser = { id: string; name: string; email: string; role: UserRole; status: AccountStatus; createdAt: string; _count: { projects: number; applications: number } };
type AdminProject = { id: string; title: string; status: ProjectStatus; submittedAt: string | null; createdAt: string; owner: { name: string; email: string }; category: { name: string } | null };
type AdminApplication = { id: string; status: ApplicationStatus; appliedAt: string; user: { name: string; email: string }; opportunity: { title: string; organization: string } };
type AdminCategory = { id: string; name: string; slug: string; description: string | null; isActive: boolean };
type AdminOpportunity = { id: string; title: string; organization: string; description: string; location: string | null; eligibilityCriteria: string; categoryId: string | null; category: { id: string; name: string } | null; status: OpportunityStatus; deadline: string | null; createdAt: string };
type AdminData = { users: AdminUser[]; projects: AdminProject[]; applications: AdminApplication[]; categories: AdminCategory[]; opportunities: AdminOpportunity[] };

const emptyData: AdminData = { users: [], projects: [], applications: [], categories: [], opportunities: [] };

const navSections: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "projects", label: "Projets & modération", icon: FolderKanban },
  { id: "applications", label: "Candidatures", icon: BriefcaseBusiness },
  { id: "categories", label: "Catégories", icon: Tags },
  { id: "opportunities", label: "Opportunités", icon: Bell },
];

const titleBySection: Record<Section, string> = {
  dashboard: "Dashboard",
  users: "Utilisateurs",
  projects: "Projets et modération",
  applications: "Candidatures",
  categories: "Catégories",
  opportunities: "Opportunités",
  settings: "Paramètres",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Actif", INACTIVE: "Inactive", SUSPENDED: "Suspendu", USER: "Utilisateur", ADMIN: "Admin",
  DRAFT: "Brouillon", SUBMITTED: "Soumis", UNDER_REVIEW: "En examen",
  APPROVED: "Approuvé", REJECTED: "Refusé", PUBLISHED: "Publié",
  PENDING: "En attente", ACCEPTED: "Acceptée", WITHDRAWN: "Retirée", CLOSED: "Clôturée",
};

const projectStatuses: ProjectStatus[] = ["UNDER_REVIEW", "APPROVED", "REJECTED", "PUBLISHED"];
const applicationStatuses: Exclude<ApplicationStatus, "PENDING" | "WITHDRAWN">[] = ["UNDER_REVIEW", "ACCEPTED", "REJECTED"];

async function adminRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("Le serveur a renvoyé une réponse invalide.");
  }
  if (!response.ok) {
    const message = result && typeof result === "object" && "message" in result ? result.message : "La demande a échoué.";
    throw new Error(Array.isArray(message) ? message.join(" ") : String(message));
  }
  return result as T;
}

async function loadAdminData(): Promise<AdminData> {
  const [users, projects, applications, categories, opportunities] = await Promise.all([
    adminRequest<AdminUser[]>("users/list"),
    adminRequest<AdminProject[]>("projects/list"),
    adminRequest<AdminApplication[]>("applications/list"),
    adminRequest<AdminCategory[]>("categories/list"),
    adminRequest<AdminOpportunity[]>("opportunities/list"),
  ]);
  return { users, projects, applications, categories, opportunities };
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)) : "—";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`admin-status admin-status--${value.toLowerCase()}`}>{statusLabels[value] ?? value}</span>;
}

export function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthSession();
  const [section, setSection] = useState<Section>("dashboard");
  const [data, setData] = useState<AdminData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [opportunityFormOpen, setOpportunityFormOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<AdminOpportunity | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AccountNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsBusy, setNotificationsBusy] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const loadedData = await loadAdminData();
      setError("");
      setData(loadedData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadAdminData()
      .then((loadedData) => {
        if (!cancelled) {
          setError("");
          setData(loadedData);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Impossible de charger les données.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filteredUsers = useMemo(() => data.users.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query.toLowerCase())), [data.users, query]);
  const filteredProjects = useMemo(() => data.projects.filter((item) => `${item.title} ${item.owner.name} ${item.owner.email}`.toLowerCase().includes(query.toLowerCase())), [data.projects, query]);
  const filteredApplications = useMemo(() => data.applications.filter((item) => `${item.user.name} ${item.opportunity.title}`.toLowerCase().includes(query.toLowerCase())), [data.applications, query]);

  async function mutate(path: string, method: string, body: unknown, successMessage: string): Promise<boolean> {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await adminRequest(path, method, body);
      setNotice(successMessage);
      await refresh();
      return true;
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "La modification a échoué.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const created = await mutate("categories", "POST", {
      name: form.get("name"),
      slug: form.get("slug") || undefined,
      description: form.get("description") || undefined,
    }, "La catégorie a été créée.");
    if (created) {
      setCategoryFormOpen(false);
      formElement.reset();
    }
  }

  async function handleSaveOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      title: form.get("title"),
      organization: form.get("organization"),
      description: form.get("description"),
      location: form.get("location") || null,
      deadline: form.get("deadline") ? new Date(String(form.get("deadline"))).toISOString() : null,
      categoryId: form.get("categoryId") || null,
      eligibilityCriteria: form.get("eligibilityCriteria") ?? "",
      status: form.get("status"),
    };
    const saved = await mutate(
      editingOpportunity ? `opportunities/${editingOpportunity.id}` : "opportunities",
      editingOpportunity ? "PATCH" : "POST",
      payload,
      editingOpportunity ? "L’opportunité a été mise à jour." : "L’opportunité a été créée.",
    );
    if (saved) {
      setOpportunityFormOpen(false);
      setEditingOpportunity(null);
      formElement.reset();
    }
  }

  async function loadNotifications() {
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(body, "Impossible de charger les notifications."));
      if (!Array.isArray(body) || !body.every(isAccountNotification)) {
        throw new Error("Le serveur a renvoyé une liste de notifications invalide.");
      }
      setNotifications(body);
    } catch (loadError) {
      setNotificationsError(loadError instanceof Error ? loadError.message : "Impossible de charger les notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function updateNotification(
    notification: AccountNotification,
    action: "read" | "delete" | "read-all",
  ) {
    setNotificationsBusy(true);
    setNotificationsError("");
    try {
      const endpoint = action === "read-all"
        ? "/api/notifications/read-all"
        : `/api/notifications/${encodeURIComponent(notification.id)}${action === "read" ? "/read" : ""}`;
      const response = await fetch(endpoint, {
        method: action === "delete" ? "DELETE" : "PATCH",
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(body, "Impossible de mettre à jour les notifications."));
      if (action === "read") {
        if (!isAccountNotification(body)) throw new Error("Le serveur a renvoyé une notification invalide.");
        setNotifications((current) => current.map((item) => item.id === body.id ? body : item));
      } else if (action === "delete") {
        setNotifications((current) => current.filter((item) => item.id !== notification.id));
      } else {
        const now = new Date().toISOString();
        setNotifications((current) => current.map((item) => item.readAt ? item : { ...item, readAt: now }));
      }
    } catch (actionError) {
      setNotificationsError(actionError instanceof Error ? actionError.message : "Impossible de mettre à jour les notifications.");
    } finally {
      setNotificationsBusy(false);
    }
  }

  function toggleNotifications() {
    const willOpen = !notificationsOpen;
    setNotificationsOpen(willOpen);
    if (willOpen) void loadNotifications();
  }

  async function handleDeleteCategory(category: AdminCategory) {
    if (!window.confirm(`Supprimer la catégorie « ${category.name} » ?`)) return;
    await mutate(`categories/${category.id}`, "DELETE", undefined, "La catégorie a été supprimée.");
  }

  async function handleLogout() {
    try {
      await logout();
      router.replace("/login");
    } catch {
      setError("La déconnexion a échoué. Réessayez.");
    }
  }

  const renderContent = () => {
    if (loading) return <div className="admin-empty"><span className="admin-loader" />Chargement des données…</div>;
    switch (section) {
      case "dashboard":
        return <DashboardOverview data={data} onNavigate={setSection} />;
      case "users":
        return <UsersPanel users={filteredUsers} busy={busy} onUpdate={(id, patch) => void mutate(`users/${id}`, "PATCH", patch, "Le compte a été mis à jour.")} />;
      case "projects":
        return <ProjectsPanel projects={filteredProjects} busy={busy} onUpdate={(id, status) => void mutate(`projects/${id}/status`, "PATCH", { status }, "Le statut du projet a été mis à jour.")} />;
      case "applications":
        return <ApplicationsPanel applications={filteredApplications} busy={busy} onUpdate={(id, status) => void mutate(`applications/${id}/status`, "PATCH", { status }, "Le statut de la candidature a été mis à jour.")} />;
      case "categories":
        return <CategoriesPanel categories={data.categories} busy={busy} formOpen={categoryFormOpen} onToggleForm={() => setCategoryFormOpen((open) => !open)} onCreate={handleCreateCategory} onToggle={(category) => void mutate(`categories/${category.id}`, "PATCH", { isActive: !category.isActive }, "La catégorie a été mise à jour.")} onDelete={(category) => void handleDeleteCategory(category)} />;
      case "opportunities":
        return <OpportunitiesPanel opportunities={data.opportunities} busy={busy} categories={data.categories} formOpen={opportunityFormOpen} editingOpportunity={editingOpportunity} onToggleForm={() => { setEditingOpportunity(null); setOpportunityFormOpen((open) => !open); }} onCreate={handleSaveOpportunity} onEdit={(item) => { setEditingOpportunity(item); setOpportunityFormOpen(true); }} onUpdate={(item, status) => void mutate(`opportunities/${item.id}`, "PATCH", { status }, "Le statut de l’opportunité a été mis à jour.")} />;
      case "settings":
        return <SettingsPanel name={user?.name ?? ""} email={user?.email ?? ""} />;
    }
  };

  return (
    <div className="admin-app">
      {sidebarOpen && <button className="admin-backdrop" aria-label="Fermer la navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`admin-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <div className="admin-brand-row">
          <Link className="admin-brand" href="/" aria-label="AfriLaunch accueil"><span>afri</span>launch<i /></Link>
          <button className="admin-icon-button admin-sidebar-close" type="button" aria-label="Fermer le menu" onClick={() => setSidebarOpen(false)}><X size={19} /></button>
        </div>
        <div className="admin-workspace"><span className="admin-workspace__icon"><ShieldCheck size={18} /></span><span><strong>AfriLaunch</strong><small>Console de gestion</small></span><ChevronDown size={15} /></div>
        <nav className="admin-nav" aria-label="Navigation de l’espace administrateur">
          <p className="admin-nav__label">ESPACE ADMIN</p>
          {navSections.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`admin-nav__item${section === id ? " is-active" : ""}`} aria-current={section === id ? "page" : undefined} onClick={() => { setSection(id); setSidebarOpen(false); setQuery(""); }}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {id === "projects" && data.projects.filter((project) => project.status === "SUBMITTED").length > 0 && <i>{data.projects.filter((project) => project.status === "SUBMITTED").length}</i>}
            </button>
          ))}
          <p className="admin-nav__label admin-nav__label--second">CONFIGURATION</p>
          <button type="button" className={`admin-nav__item${section === "settings" ? " is-active" : ""}`} onClick={() => { setSection("settings"); setSidebarOpen(false); }}><Settings size={18} strokeWidth={1.8} /><span>Paramètres</span></button>
        </nav>
        <div className="admin-sidebar__bottom">
          <div className="admin-help"><span><CircleHelp size={17} /></span><strong>Besoin d’aide ?</strong><small>Consultez le centre d’assistance.</small><button type="button" onClick={() => setNotice("Contactez l’équipe AfriLaunch pour obtenir de l’aide.")}>Obtenir de l’aide <ArrowUpRight size={14} /></button></div>
          <div className="admin-profile"><span className="admin-avatar">{user ? initials(user.name) : "AD"}</span><span><strong>{user?.name}</strong><small>Administrateur</small></span><button type="button" aria-label="Déconnexion" onClick={() => void handleLogout()}><LogOut size={17} /></button></div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-icon-button admin-menu-button" type="button" aria-label="Ouvrir la navigation" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <div className="admin-breadcrumb"><span>AfriLaunch</span><b>/</b><strong>{titleBySection[section]}</strong></div>
          <div className="admin-topbar__actions">
            {section !== "settings" && <label className="admin-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher..." aria-label="Rechercher dans la section" /><kbd>⌘ K</kbd></label>}
            <div className="admin-notification-wrap">
              <button className="admin-icon-button admin-notification" type="button" aria-label={`Notifications${notifications.some((item) => !item.readAt) ? `, ${notifications.filter((item) => !item.readAt).length} non lues` : ""}`} aria-expanded={notificationsOpen} onClick={toggleNotifications}>
                <Bell size={19} />
                {notifications.some((item) => !item.readAt) && <i />}
              </button>
              {notificationsOpen && <section className="admin-notification-panel" aria-label="Notifications">
                <div className="admin-notification-panel__heading">
                  <div><strong>Notifications</strong><small>{notifications.filter((item) => !item.readAt).length} non lues</small></div>
                  <button className="admin-icon-button" type="button" aria-label="Fermer les notifications" onClick={() => setNotificationsOpen(false)}><X size={17} /></button>
                </div>
                {notificationsError && <p className="admin-notification-panel__error" role="alert">{notificationsError}</p>}
                {notificationsLoading ? <p className="admin-notification-panel__empty" role="status">Chargement…</p> : notifications.length ? <>
                  {notifications.some((item) => !item.readAt) && <button className="admin-notification-panel__mark-all" type="button" disabled={notificationsBusy} onClick={() => void updateNotification(notifications[0], "read-all")}><CheckCheck size={14} /> Tout marquer comme lu</button>}
                  <div className="admin-notification-panel__list">{notifications.slice(0, 8).map((notification) => <article className={`admin-notification-item${notification.readAt ? "" : " is-unread"}`} key={notification.id}>
                    <div><strong>{notification.title}</strong><p>{notification.message}</p><small>{formatDate(notification.createdAt)}</small></div>
                    <span>
                      {!notification.readAt && <button type="button" disabled={notificationsBusy} aria-label={`Marquer « ${notification.title} » comme lue`} onClick={() => void updateNotification(notification, "read")}><CheckCheck size={14} /></button>}
                      <button type="button" disabled={notificationsBusy} aria-label={`Supprimer « ${notification.title} »`} onClick={() => void updateNotification(notification, "delete")}><Trash2 size={14} /></button>
                    </span>
                  </article>)}</div>
                </> : <p className="admin-notification-panel__empty">Aucune notification.</p>}
              </section>}
            </div>
            <span className="admin-topbar__divider" />
            <span className="admin-topbar__user"><span className="admin-avatar">{user ? initials(user.name) : "AD"}</span><span><strong>{user?.name}</strong><small>Administrateur</small></span></span>
          </div>
        </header>
        <div className="admin-content">
          <div className="admin-page-heading">
            <div><p className="admin-eyebrow">ESPACE ADMIN</p><h1>{titleBySection[section]}</h1><p>{sectionDescription(section)}</p></div>
            <span className="admin-date">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }).format(new Date())}</span>
          </div>
          {error && <div className="admin-alert admin-alert--error" role="alert"><span>{error}</span><button type="button" aria-label="Fermer l’erreur" onClick={() => setError("")}><X size={16} /></button></div>}
          {notice && <div className="admin-alert admin-alert--success" role="status"><Check size={17} /><span>{notice}</span><button type="button" aria-label="Fermer le message" onClick={() => setNotice("")}><X size={16} /></button></div>}
          {renderContent()}
          <footer className="admin-footer"><span>© {new Date().getFullYear()} AfriLaunch</span><span>Console d’administration sécurisée <ShieldCheck size={14} /></span></footer>
        </div>
      </main>
    </div>
  );
}

function sectionDescription(section: Section) {
  const descriptions: Record<Section, string> = {
    dashboard: "Suivez l’activité de la plateforme et les éléments à traiter.",
    users: "Gérez les comptes, les rôles et l’accès des membres.",
    projects: "Examinez les projets soumis et gérez leur publication.",
    applications: "Suivez les candidatures et traitez les demandes reçues.",
    categories: "Organisez les catégories utilisées sur la plateforme.",
    opportunities: "Publiez et gérez les opportunités proposées aux utilisateurs.",
    settings: "Consultez les informations de votre compte administrateur.",
  };
  return descriptions[section];
}

function DashboardOverview({ data, onNavigate }: { data: AdminData; onNavigate: (section: Section) => void }) {
  const pendingProjects = data.projects.filter((project) => project.status === "SUBMITTED");
  const pendingApplications = data.applications.filter((application) => application.status === "PENDING");
  const metrics = [
    { label: "Utilisateurs", value: data.users.length, detail: "Comptes enregistrés", icon: Users, color: "purple", change: `${data.users.filter((item) => item.status === "ACTIVE").length} actifs` },
    { label: "Projets", value: data.projects.length, detail: "Projets sur la plateforme", icon: FolderKanban, color: "blue", change: `${pendingProjects.length} à examiner` },
    { label: "Candidatures", value: data.applications.length, detail: "Candidatures reçues", icon: BriefcaseBusiness, color: "orange", change: `${pendingApplications.length} en attente` },
    { label: "Opportunités", value: data.opportunities.length, detail: "Offres disponibles", icon: Bell, color: "green", change: `${data.opportunities.filter((item) => item.status === "PUBLISHED").length} publiées` },
  ];
  return <>
    <div className="admin-metrics">{metrics.map(({ label, value, detail, icon: Icon, color, change }) => <article className="admin-metric" key={label}><div className="admin-metric__top"><span>{label}</span><i className={`admin-metric__icon is-${color}`}><Icon size={18} /></i></div><strong>{value.toLocaleString("fr-FR")}</strong><div className="admin-metric__bottom"><span>{detail}</span><b><ArrowUpRight size={13} />{change}</b></div></article>)}</div>
    <div className="admin-overview-grid">
      <section className="admin-card admin-review-card"><div className="admin-card__heading"><div><h2>À traiter</h2><p>Les éléments qui nécessitent votre attention.</p></div><span className="admin-live-dot">En direct</span></div>
        <button className="admin-review-row" type="button" onClick={() => onNavigate("projects")}><span className="admin-review-icon is-purple"><FolderKanban size={18} /></span><span><strong>Projets à examiner</strong><small>Demandes de modération en attente</small></span><b>{pendingProjects.length}</b><ArrowDownRight size={16} /></button>
        <button className="admin-review-row" type="button" onClick={() => onNavigate("applications")}><span className="admin-review-icon is-orange"><BriefcaseBusiness size={18} /></span><span><strong>Candidatures à traiter</strong><small>Nouvelles candidatures reçues</small></span><b>{pendingApplications.length}</b><ArrowDownRight size={16} /></button>
        <button className="admin-review-row" type="button" onClick={() => onNavigate("users")}><span className="admin-review-icon is-blue"><Users size={18} /></span><span><strong>Comptes suspendus</strong><small>Comptes bloqués actuellement</small></span><b>{data.users.filter((item) => item.status === "SUSPENDED").length}</b><ArrowDownRight size={16} /></button>
      </section>
      <section className="admin-card admin-activity-card"><div className="admin-card__heading"><div><h2>Activité récente</h2><p>Derniers projets ajoutés à la plateforme.</p></div><button className="admin-text-button" type="button" onClick={() => onNavigate("projects")}>Voir les projets <ArrowUpRight size={14} /></button></div>
        {data.projects.slice(0, 5).map((project) => <div className="admin-activity-row" key={project.id}><span className="admin-activity-avatar">{initials(project.owner.name)}</span><span><strong>{project.title}</strong><small>{project.owner.name} · {formatDate(project.createdAt)}</small></span><StatusBadge value={project.status} /></div>)}
        {!data.projects.length && <p className="admin-blank">Aucun projet n’est encore enregistré.</p>}
      </section>
    </div>
  </>;
}

function UsersPanel({ users, busy, onUpdate }: { users: AdminUser[]; busy: boolean; onUpdate: (id: string, patch: Partial<AdminUser>) => void }) {
  return <section className="admin-card admin-table-card"><div className="admin-card__heading"><div><h2>Comptes utilisateurs</h2><p>{users.length} compte{users.length === 1 ? "" : "s"} affiché{users.length === 1 ? "" : "s"}.</p></div></div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Utilisateur</th><th>Rôle</th><th>Statut</th><th>Activité</th><th>Inscription</th></tr></thead><tbody>
      {users.map((item) => <tr key={item.id}><td><div className="admin-person"><span className="admin-avatar">{initials(item.name)}</span><span><strong>{item.name}</strong><small>{item.email}</small></span></div></td>
        <td><select className="admin-inline-select" aria-label={`Rôle de ${item.name}`} value={item.role} disabled={busy} onChange={(event) => onUpdate(item.id, { role: event.target.value as UserRole })}><option value="USER">Utilisateur</option><option value="ADMIN">Administrateur</option></select></td>
        <td><select className="admin-inline-select" aria-label={`Statut de ${item.name}`} value={item.status} disabled={busy} onChange={(event) => onUpdate(item.id, { status: event.target.value as AccountStatus })}><option value="ACTIVE">Actif</option><option value="SUSPENDED">Suspendu</option></select></td>
        <td><span className="admin-activity-count">{item._count.projects} projets · {item._count.applications} candidatures</span></td><td>{formatDate(item.createdAt)}</td></tr>)}
    </tbody></table>{!users.length && <p className="admin-blank">Aucun utilisateur trouvé.</p>}</div>
  </section>;
}

function ProjectsPanel({ projects, busy, onUpdate }: { projects: AdminProject[]; busy: boolean; onUpdate: (id: string, status: ProjectStatus) => void }) {
  return <section className="admin-card admin-table-card"><div className="admin-card__heading"><div><h2>Projets soumis</h2><p>Examinez chaque proposition et actualisez son statut.</p></div><span className="admin-count-pill">{projects.filter((item) => item.status === "SUBMITTED").length} à examiner</span></div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Projet</th><th>Porteur</th><th>Catégorie</th><th>Soumis le</th><th>Statut</th><th>Modération</th></tr></thead><tbody>
      {projects.map((item) => <tr key={item.id}><td><strong>{item.title}</strong></td><td><span className="admin-table-person">{item.owner.name}<small>{item.owner.email}</small></span></td><td>{item.category?.name ?? "Sans catégorie"}</td><td>{formatDate(item.submittedAt)}</td><td><StatusBadge value={item.status} /></td><td><select className="admin-inline-select" aria-label={`Modérer ${item.title}`} disabled={busy || item.status === "DRAFT"} value={projectStatuses.includes(item.status) ? item.status : "UNDER_REVIEW"} onChange={(event) => onUpdate(item.id, event.target.value as ProjectStatus)}><option value="UNDER_REVIEW">En examen</option><option value="APPROVED">Approuvé</option><option value="REJECTED">Refusé</option><option value="PUBLISHED">Publié</option></select></td></tr>)}
    </tbody></table>{!projects.length && <p className="admin-blank">Aucun projet trouvé.</p>}</div>
  </section>;
}

function ApplicationsPanel({ applications, busy, onUpdate }: { applications: AdminApplication[]; busy: boolean; onUpdate: (id: string, status: ApplicationDecision) => void }) {
  return <section className="admin-card admin-table-card"><div className="admin-card__heading"><div><h2>Candidatures reçues</h2><p>Examinez les dossiers et mettez à jour leur suivi.</p></div></div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Candidat</th><th>Opportunité</th><th>Organisation</th><th>Date</th><th>Statut</th><th>Décision</th></tr></thead><tbody>
      {applications.map((item) => <tr key={item.id}><td><span className="admin-table-person">{item.user.name}<small>{item.user.email}</small></span></td><td><strong>{item.opportunity.title}</strong></td><td>{item.opportunity.organization}</td><td>{formatDate(item.appliedAt)}</td><td><StatusBadge value={item.status} /></td><td><select className="admin-inline-select" aria-label={`Décision pour ${item.user.name}`} disabled={busy} value={applicationStatuses.includes(item.status as typeof applicationStatuses[number]) ? item.status : "UNDER_REVIEW"} onChange={(event) => onUpdate(item.id, event.target.value as ApplicationDecision)}><option value="UNDER_REVIEW">En examen</option><option value="ACCEPTED">Acceptée</option><option value="REJECTED">Refusée</option></select></td></tr>)}
    </tbody></table>{!applications.length && <p className="admin-blank">Aucune candidature trouvée.</p>}</div>
  </section>;
}

type ApplicationDecision = Exclude<ApplicationStatus, "PENDING" | "WITHDRAWN">;

function CategoriesPanel({ categories, busy, formOpen, onToggleForm, onCreate, onToggle, onDelete }: { categories: AdminCategory[]; busy: boolean; formOpen: boolean; onToggleForm: () => void; onCreate: (event: FormEvent<HTMLFormElement>) => void; onToggle: (category: AdminCategory) => void; onDelete: (category: AdminCategory) => void }) {
  return <>
    <div className="admin-section-toolbar"><span>{categories.length} catégorie{categories.length === 1 ? "" : "s"}</span><button type="button" className="admin-primary-button" onClick={onToggleForm}><Plus size={16} /> Nouvelle catégorie</button></div>
    {formOpen && <form className="admin-card admin-form-card" onSubmit={onCreate}><div className="admin-card__heading"><div><h2>Ajouter une catégorie</h2><p>Le slug est généré automatiquement s’il est laissé vide.</p></div><button className="admin-icon-button" type="button" aria-label="Fermer" onClick={onToggleForm}><X size={18} /></button></div><div className="admin-form-grid"><label>Nom<input name="name" required minLength={2} maxLength={100} /></label><label>Slug (facultatif)<input name="slug" maxLength={120} /></label><label className="is-wide">Description<textarea name="description" rows={3} maxLength={2000} /></label></div><button className="admin-primary-button" disabled={busy} type="submit">{busy ? "Enregistrement…" : "Créer la catégorie"}</button></form>}
    <div className="admin-category-grid">{categories.map((item) => <article className="admin-card admin-category-card" key={item.id}><div className="admin-category-card__top"><span className="admin-review-icon is-purple"><Tags size={18} /></span><StatusBadge value={item.isActive ? "ACTIVE" : "INACTIVE"} /><button className="admin-icon-button admin-category-delete" type="button" aria-label={`Supprimer la catégorie ${item.name}`} disabled={busy} onClick={() => onDelete(item)}><Trash2 size={15} /></button></div><h2>{item.name}</h2><code>{item.slug}</code><p>{item.description || "Aucune description renseignée."}</p><button className={`admin-switch${item.isActive ? " is-on" : ""}`} role="switch" aria-checked={item.isActive} disabled={busy} onClick={() => onToggle(item)}><span />{item.isActive ? "Active" : "Inactive"}</button></article>)}</div>
    {!categories.length && <div className="admin-card admin-blank">Aucune catégorie. Créez-en une pour organiser les projets.</div>}
  </>;
}

function OpportunitiesPanel({ opportunities, busy, categories, formOpen, editingOpportunity, onToggleForm, onCreate, onEdit, onUpdate }: { opportunities: AdminOpportunity[]; busy: boolean; categories: AdminCategory[]; formOpen: boolean; editingOpportunity: AdminOpportunity | null; onToggleForm: () => void; onCreate: (event: FormEvent<HTMLFormElement>) => void; onEdit: (item: AdminOpportunity) => void; onUpdate: (item: AdminOpportunity, status: OpportunityStatus) => void }) {
  return <>
    <div className="admin-section-toolbar"><span>{opportunities.length} opportunité{opportunities.length === 1 ? "" : "s"} enregistrée{opportunities.length === 1 ? "" : "s"}</span><button type="button" className="admin-primary-button" onClick={onToggleForm}><Plus size={16} /> Nouvelle opportunité</button></div>
    {formOpen && <form key={editingOpportunity?.id ?? "new"} className="admin-card admin-form-card" onSubmit={onCreate}><div className="admin-card__heading"><div><h2>{editingOpportunity ? "Modifier l’opportunité" : "Créer une opportunité"}</h2><p>Renseignez les informations de l’offre pour la communauté AfriLaunch.</p></div><button className="admin-icon-button" type="button" aria-label="Fermer" onClick={onToggleForm}><X size={18} /></button></div><div className="admin-form-grid"><label>Titre<input name="title" defaultValue={editingOpportunity?.title ?? ""} required minLength={2} maxLength={180} /></label><label>Organisation<input name="organization" defaultValue={editingOpportunity?.organization ?? ""} required minLength={2} maxLength={180} /></label><label>Lieu (facultatif)<input name="location" defaultValue={editingOpportunity?.location ?? ""} maxLength={180} /></label><label>Date limite<input name="deadline" type="date" defaultValue={editingOpportunity?.deadline ? editingOpportunity.deadline.slice(0, 10) : ""} /></label><label>Catégorie<select name="categoryId" defaultValue={editingOpportunity?.categoryId ?? ""}><option value="">Aucune catégorie</option>{categories.filter((item) => item.isActive || item.id === editingOpportunity?.categoryId).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Publication<select name="status" defaultValue={editingOpportunity?.status ?? "DRAFT"}><option value="DRAFT">Brouillon</option><option value="PUBLISHED">Publier immédiatement</option><option value="CLOSED">Clôturée</option></select></label><label className="is-wide">Critères d’éligibilité<textarea name="eligibilityCriteria" defaultValue={editingOpportunity?.eligibilityCriteria ?? ""} maxLength={5000} rows={3} /></label><label className="is-wide">Description<textarea name="description" defaultValue={editingOpportunity?.description ?? ""} required minLength={20} maxLength={12000} rows={5} /></label></div><button className="admin-primary-button" disabled={busy} type="submit">{busy ? "Enregistrement…" : editingOpportunity ? "Enregistrer les modifications" : "Créer l’opportunité"}</button></form>}
    <section className="admin-card admin-table-card"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Opportunité</th><th>Organisation</th><th>Catégorie</th><th>Date limite</th><th>Statut</th><th>Actions</th></tr></thead><tbody>
      {opportunities.map((item) => <tr key={item.id}><td><strong>{item.title}</strong></td><td>{item.organization}</td><td>{item.category?.name ?? "—"}</td><td>{formatDate(item.deadline)}</td><td><StatusBadge value={item.status} /></td><td><div className="admin-opportunity-actions"><select className="admin-inline-select" aria-label={`Publication de ${item.title}`} disabled={busy} value={item.status} onChange={(event) => onUpdate(item, event.target.value as OpportunityStatus)}><option value="DRAFT">Brouillon</option><option value="PUBLISHED">Publiée</option><option value="CLOSED">Clôturée</option></select><button className="admin-text-button" type="button" disabled={busy} onClick={() => onEdit(item)}>Modifier</button></div></td></tr>)}
    </tbody></table>{!opportunities.length && <p className="admin-blank">Aucune opportunité enregistrée.</p>}</div></section>
  </>;
}

function SettingsPanel({ name, email }: { name: string; email: string }) {
  const { updateEmail } = useAuthSession();
  const [emailInput, setEmailInput] = useState(email);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailNotice, setEmailNotice] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError("");
    setEmailNotice("");
    setEmailSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        throw new Error(apiError(body, "Impossible de modifier l’adresse e-mail."));
      }
      const updatedEmail = emailInput.trim().toLowerCase();
      setEmailInput(updatedEmail);
      updateEmail(updatedEmail);
      setEmailNotice("Votre adresse e-mail a été modifiée.");
    } catch (changeError) {
      setEmailError(changeError instanceof Error ? changeError.message : "Impossible de modifier l’adresse e-mail.");
    } finally {
      setEmailSaving(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (newPassword !== confirmPassword) {
      setError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(body, "Impossible de modifier le mot de passe."));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("Votre mot de passe a été modifié.");
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Impossible de modifier le mot de passe.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="admin-settings-stack">
    <section className="admin-card admin-settings-card"><div className="admin-card__heading"><div><h2>Compte administrateur</h2><p>Informations de la session actuellement connectée.</p></div></div><div className="admin-settings-profile"><span className="admin-avatar admin-avatar--large">{initials(name)}</span><span><strong>{name}</strong><small>Accès administrateur global</small></span></div><dl><div><dt>Nom</dt><dd>{name}</dd></div><div><dt>Adresse e-mail</dt><dd>{email}</dd></div><div><dt>Rôle</dt><dd><StatusBadge value="ADMIN" /></dd></div><div><dt>Authentification</dt><dd>Session sécurisée</dd></div></dl>
      {emailError && <p className="admin-settings-error" role="alert">{emailError}</p>}{emailNotice && <p className="admin-settings-success" role="status">{emailNotice}</p>}
      <form className="admin-settings-email-form" onSubmit={(event) => void changeEmail(event)}>
        <label>Modifier l’adresse e-mail<input type="email" autoComplete="email" value={emailInput} onChange={(event) => setEmailInput(event.target.value)} required maxLength={254} /></label>
        <button className="admin-primary-button" type="submit" disabled={emailSaving || emailInput.trim().toLowerCase() === email}>{emailSaving ? "Enregistrement…" : "Enregistrer l’adresse e-mail"}</button>
      </form>
      <p className="admin-settings-note"><ShieldCheck size={17} /> Les changements de rôle et d’accès des comptes se gèrent dans la rubrique Utilisateurs.</p></section>
    <section className="admin-card admin-settings-card"><div className="admin-card__heading"><div><h2>Sécurité</h2><p>Modifiez le mot de passe de votre compte administrateur.</p></div></div>
      {error && <p className="admin-settings-error" role="alert">{error}</p>}{notice && <p className="admin-settings-success" role="status">{notice}</p>}
      <form className="admin-settings-password-form" onSubmit={(event) => void changePassword(event)}>
        <label>Mot de passe actuel<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required maxLength={128} /></label>
        <label>Nouveau mot de passe<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={10} maxLength={128} /><small>Au moins 10 caractères.</small></label>
        <label>Confirmer le nouveau mot de passe<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={10} maxLength={128} /></label>
        <button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "Modification…" : "Modifier le mot de passe"}</button>
      </form>
    </section>
  </div>;
}
