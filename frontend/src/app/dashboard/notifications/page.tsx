"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, FileCheck2, Lightbulb, UserRound } from "lucide-react";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { apiError, isAccountNotification, type AccountNotification } from "@/types/account-data";

const filters = ["Toutes", "Non lues", "Lues", "Projet", "Candidature", "Opportunité", "Compte"] as const;
const categoryLabels: Record<string, string> = { PROJECT: "Projet", APPLICATION: "Candidature", OPPORTUNITY: "Opportunité", ACCOUNT: "Compte" };

function NotificationIcon({ category }: { category: string }) {
  if (category === "PROJECT") return <FileCheck2 size={17} />;
  if (category === "OPPORTUNITY") return <Lightbulb size={17} />;
  if (category === "ACCOUNT") return <UserRound size={17} />;
  return <Bell size={17} />;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AccountNotification[]>([]);
  const [filter, setFilter] = useState<string>("Toutes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/notifications", { cache: "no-store" })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) throw new Error(apiError(body, "Impossible de charger vos notifications."));
        if (!Array.isArray(body) || !body.every(isAccountNotification)) throw new Error("La réponse du serveur pour les notifications est invalide.");
        return body;
      })
      .then((result) => { if (active) setNotifications(result); })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : "Impossible de charger vos notifications."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleNotifications = useMemo(() => notifications.filter((notification) => {
    const category = categoryLabels[notification.type] ?? "Compte";
    if (filter === "Non lues") return !notification.readAt;
    if (filter === "Lues") return Boolean(notification.readAt);
    if (filter === "Toutes") return true;
    return category === filter;
  }), [filter, notifications]);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  async function markRead(notification: AccountNotification) {
    if (notification.readAt) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/notifications/${encodeURIComponent(notification.id)}/read`, { method: "PATCH" });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(body, "Impossible de mettre à jour la notification."));
      if (!isAccountNotification(body)) throw new Error("Le serveur a renvoyé une notification invalide.");
      setNotifications((current) => current.map((item) => item.id === body.id ? body : item));
      window.dispatchEvent(new Event("afrilauch:notifications-updated"));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Impossible de mettre à jour la notification.");
    } finally {
      setPending(false);
    }
  }

  async function markAllRead() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/notifications/read-all", { method: "PATCH" });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(body, "Impossible de mettre à jour vos notifications."));
      const now = new Date().toISOString();
      setNotifications((current) => current.map((item) => item.readAt ? item : { ...item, readAt: now }));
      window.dispatchEvent(new Event("afrilauch:notifications-updated"));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Impossible de mettre à jour vos notifications.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <DashboardPageHeader eyebrow="Votre activité" title="Notifications" description={unreadCount ? `Vous avez ${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}.` : "Vous êtes à jour."} action={<button className="dashboard-button dashboard-button--light" type="button" onClick={() => void markAllRead()} disabled={unreadCount === 0 || pending}><CheckCheck size={15} /> Tout marquer comme lu</button>} />
      {error && <p className="dashboard-form-error" role="alert">{error}</p>}
      <div className="dashboard-toolbar"><div className="dashboard-filter-pills">{filters.map((item) => <button className={`dashboard-filter-pill${filter === item ? " is-active" : ""}`} key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
      {loading ? <div className="dashboard-empty" role="status">Chargement des notifications…</div> : visibleNotifications.length ? (
        <section className="dashboard-card">
          {visibleNotifications.map((notification) => {
            const category = categoryLabels[notification.type] ?? "Compte";
            return <article className={`dashboard-notice dashboard-notice--row${notification.readAt ? "" : " is-unread"}`} key={notification.id}>
              <span className="dashboard-notice__icon"><NotificationIcon category={notification.type} /></span>
              <div className="dashboard-notice__content"><div><strong>{notification.title}</strong>{!notification.readAt && <span className="dashboard-unread-dot" aria-label="Non lue" />}</div><p>{notification.message}</p><small>{category} · {formatDate(notification.createdAt)}</small></div>
              {!notification.readAt && <button className="dashboard-icon-button" type="button" disabled={pending} onClick={() => void markRead(notification)} aria-label="Marquer comme lue"><CheckCheck size={15} /></button>}
            </article>;
          })}
        </section>
      ) : <div className="dashboard-empty"><Bell size={24} /><h2>{notifications.length ? "Aucune notification dans cette catégorie" : "Aucune notification"}</h2><p>{notifications.length ? "Choisissez un autre filtre pour afficher vos notifications." : "Les notifications liées à votre compte apparaîtront ici."}</p></div>}
    </>
  );
}
