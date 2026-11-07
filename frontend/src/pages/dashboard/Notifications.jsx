import { useState } from "react";
import { BellOff, CheckCheck } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/Section";
import { LoadingBlock } from "@/components/ui/Spinner";
import { notificationApi } from "@/api/endpoints";
import { useApi, useSubmit } from "@/hooks/useApi";
import { NOTIFICATION_STYLES } from "@/lib/constants";
import { cn, timeAgoAr } from "@/lib/utils";

const TABS = [
  { key: "all", label: "الكل" },
  { key: "matches", label: "منح مطابقة" },
  { key: "deadlines", label: "مواعيد التقديم" },
];

export default function NotificationsPage() {
  const [tab, setTab] = useState("all");
  const { data, loading, error, reload } = useApi(() => notificationApi.list(tab), [tab]);

  const markAll = useSubmit(notificationApi.markAllRead);
  const markOne = useSubmit(notificationApi.markRead);

  const items = data?.data ?? [];
  const tabs = data?.meta?.tabs ?? {};
  const unread = data?.meta?.unread ?? 0;

  const onMarkAll = async () => {
    const { ok } = await markAll.submit();
    if (ok) reload(true);
  };

  const onOpen = async (notification) => {
    if (notification.is_read) return;
    const { ok } = await markOne.submit(notification.id);
    if (ok) reload(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإشعارات"
        description="تنبيهات المنح المطابقة ومواعيد التقديم وتحديثات طلباتك."
        actions={
          unread > 0 ? (
            <Button variant="soft" size="sm" onClick={onMarkAll} loading={markAll.submitting}>
              <CheckCheck className="size-4" />
              تعليم الكل كمقروء
            </Button>
          ) : null
        }
      />

      {/* التابات */}
      <div className="flex gap-2 overflow-x-auto scrollbar-slim">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition",
              tab === item.key ? "bg-navy-700 text-white" : "glass text-ink-600 hover:bg-white/55",
            )}
          >
            {item.label}
            <span
              className={cn(
                "num rounded-full px-1.5 py-0.5 text-[11px]",
                tab === item.key ? "bg-white/20" : "bg-ink-100 text-ink-500",
              )}
            >
              {tabs[item.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {loading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BellOff className="size-7" />}
          title="لا توجد إشعارات"
          description="ستصلك هنا تنبيهات المنح المطابقة لملفك ومواعيد التقديم القريبة."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((notification) => {
            const style = NOTIFICATION_STYLES[notification.type] ?? NOTIFICATION_STYLES.system;

            return (
              <li
                key={notification.id}
                className={cn(
                  "rounded-2xl border-s-4 glass p-4 transition",
                  style.bar,
                  !notification.is_read && "bg-navy-500/8",
                )}
              >
                <div className="flex items-start gap-3.5">
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", style.chip)}>
                    <Icon name={style.icon} className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-navy-800">{notification.title}</h2>
                      {notification.badge_label ? (
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", style.chip)}>
                          {notification.badge_label}
                        </span>
                      ) : null}
                      {!notification.is_read ? (
                        <span className="size-2 rounded-full bg-navy-600" aria-label="غير مقروء" />
                      ) : null}
                    </div>

                    <p className="mt-1.5 text-[13px] leading-7 text-ink-600">{notification.body}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="text-[12px] text-ink-400">{timeAgoAr(notification.created_at)}</span>

                      {notification.action_url ? (
                        <ButtonLink
                          to={notification.action_url}
                          size="sm"
                          variant="soft"
                          onClick={() => onOpen(notification)}
                        >
                          {notification.action_label ?? "عرض"}
                        </ButtonLink>
                      ) : null}

                      {!notification.is_read ? (
                        <button
                          type="button"
                          onClick={() => onOpen(notification)}
                          className="inline-flex min-h-9 items-center text-[12px] font-semibold text-ink-500 hover:text-navy-700 hover:underline"
                        >
                          تعليم كمقروء
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
