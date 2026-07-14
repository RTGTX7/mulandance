"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Loader2, Plus, Trash2 } from "lucide-react";
import { AdminSectionTabs } from "@/components/layout/AdminSectionTabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  isAuthenticated,
  type Studio,
  type StudioRoom,
  unifiedScheduleApi,
  usersApi,
} from "@/lib/api";
import { hasPermission } from "@/lib/permissions";

type Locale = "zh" | "en" | "fr";

const text = {
  zh: {
    title: "Studio 资源",
    subtitle:
      "管理校区、Studio、教室以及是否允许对外出租。固定课程和预约会使用这里的资源。",
    studioName: "Studio / 校区名称",
    roomName: "教室名称",
    addStudio: "添加 Studio",
    addRoom: "添加教室",
    publicRental: "对外出租",
    empty: "尚未建立 Studio。请先添加一个 Studio。",
    deleteStudio: "确认删除这个 Studio 吗？已有排课记录时系统会将其停用。",
    deleteRoom: "确认删除这个教室吗？已有排课记录时系统会将其停用。",
    loadFailed: "无法加载 Studio 资源。",
    saveFailed: "无法更新 Studio 资源。",
  },
  en: {
    title: "Studio Resources",
    subtitle:
      "Manage locations, studios, rooms, and public rental availability. Scheduling uses these resources.",
    studioName: "Studio / location name",
    roomName: "Room name",
    addStudio: "Add studio",
    addRoom: "Add room",
    publicRental: "Public rental",
    empty: "No studio has been created yet. Add a studio first.",
    deleteStudio:
      "Delete this studio? It will be deactivated if scheduling history exists.",
    deleteRoom:
      "Delete this room? It will be deactivated if scheduling history exists.",
    loadFailed: "Unable to load studio resources.",
    saveFailed: "Unable to update studio resources.",
  },
  fr: {
    title: "Ressources du studio",
    subtitle:
      "Gérez les emplacements, studios, salles et leur disponibilité à la location publique.",
    studioName: "Nom du studio / emplacement",
    roomName: "Nom de la salle",
    addStudio: "Ajouter un studio",
    addRoom: "Ajouter une salle",
    publicRental: "Location publique",
    empty: "Aucun studio n’a encore été créé. Ajoutez d’abord un studio.",
    deleteStudio:
      "Supprimer ce studio ? Il sera désactivé si un historique existe.",
    deleteRoom:
      "Supprimer cette salle ? Elle sera désactivée si un historique existe.",
    loadFailed: "Impossible de charger les ressources du studio.",
    saveFailed: "Impossible de modifier les ressources du studio.",
  },
};

export function StudioResourcesWorkspaceContent({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const rawLocale = pathname.split("/")[1] || "en";
  const locale: Locale =
    rawLocale === "fr"
      ? "fr"
      : rawLocale === "zh" || rawLocale === "zh-Hant"
        ? "zh"
        : "en";
  const copy = text[locale];
  const [studios, setStudios] = useState<Studio[]>([]);
  const [rooms, setRooms] = useState<StudioRoom[]>([]);
  const [studioName, setStudioName] = useState("");
  const [roomNames, setRoomNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [canManage, setCanManage] = useState(false);

  const activeStudios = useMemo(
    () => studios.filter((studio) => studio.is_active),
    [studios],
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const me = await usersApi.me();
      setCanManage(hasPermission(me, "system.studio", "manage"));
      const [nextStudios, nextRooms] = await Promise.all([
        unifiedScheduleApi.studios(),
        unifiedScheduleApi.resources(),
      ]);
      setStudios(nextStudios);
      setRooms(nextRooms);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(`/${rawLocale}/admin/login`);
      return;
    }
    void load();
  }, [rawLocale, router]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  const addStudio = () => {
    const name = studioName.trim();
    if (!name) return;
    void run(async () => {
      await unifiedScheduleApi.createStudio({ name, is_active: true });
      setStudioName("");
    });
  };

  const addRoom = (studio: Studio) => {
    const name = (roomNames[studio.id] || "").trim();
    if (!name) return;
    const studioRooms = rooms.filter((room) => room.studio_id === studio.id);
    void run(async () => {
      await unifiedScheduleApi.createRoom({
        studio_id: studio.id,
        name,
        sort_order: studioRooms.length,
        is_active: true,
        is_rentable: false,
      });
      setRoomNames((current) => ({ ...current, [studio.id]: "" }));
    });
  };

  const setRentable = (room: StudioRoom, checked: boolean) => {
    void run(() =>
      unifiedScheduleApi.updateRoom(room.id, { ...room, is_rentable: checked }),
    );
  };
  const Content = embedded ? "section" : "main";

  return (
    <div className={embedded ? "" : "min-h-screen bg-muted/30"}>
      {!embedded && (
        <header className="sticky top-0 z-10 border-b bg-card">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <AdminSectionTabs />
          </div>
        </header>
      )}
      <Content
        className={
          embedded ? "space-y-6" : "mx-auto max-w-7xl space-y-6 px-4 py-6"
        }
      >
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Building2 className="h-6 w-6 text-primary" />
            {copy.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <fieldset
          disabled={!canManage}
          className={!canManage ? "opacity-80" : ""}
        >
          <Card>
            <CardHeader>
              <CardTitle>{copy.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-2 rounded-md border bg-slate-50 p-4 sm:flex-row">
                <Input
                  value={studioName}
                  placeholder={copy.studioName}
                  disabled={busy}
                  onChange={(event) => setStudioName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addStudio();
                    }
                  }}
                />
                <Button
                  type="button"
                  disabled={busy || !studioName.trim()}
                  onClick={addStudio}
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {copy.addStudio}
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : activeStudios.length === 0 ? (
                <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                  {copy.empty}
                </p>
              ) : (
                activeStudios.map((studio) => (
                  <section key={studio.id} className="rounded-md border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-semibold">{studio.name}</h2>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={busy}
                        title={copy.deleteStudio}
                        onClick={() => {
                          if (window.confirm(copy.deleteStudio))
                            void run(() =>
                              unifiedScheduleApi.removeStudio(studio.id),
                            );
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {rooms
                        .filter((room) => room.studio_id === studio.id)
                        .map((room) => (
                          <div
                            key={room.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                          >
                            <span>{room.name}</span>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Switch
                                  checked={room.is_rentable}
                                  disabled={busy}
                                  onCheckedChange={(checked) =>
                                    setRentable(room, checked)
                                  }
                                />
                                {copy.publicRental}
                              </label>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={busy}
                                title={copy.deleteRoom}
                                onClick={() => {
                                  if (window.confirm(copy.deleteRoom))
                                    void run(() =>
                                      unifiedScheduleApi.removeRoom(room.id),
                                    );
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={roomNames[studio.id] || ""}
                        placeholder={copy.roomName}
                        disabled={busy}
                        onChange={(event) =>
                          setRoomNames((current) => ({
                            ...current,
                            [studio.id]: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addRoom(studio);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy || !(roomNames[studio.id] || "").trim()}
                        onClick={() => addRoom(studio)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {copy.addRoom}
                      </Button>
                    </div>
                  </section>
                ))
              )}
            </CardContent>
          </Card>
        </fieldset>
      </Content>
    </div>
  );
}

export default function StudioResourcesPage() {
  return <StudioResourcesWorkspaceContent />;
}
