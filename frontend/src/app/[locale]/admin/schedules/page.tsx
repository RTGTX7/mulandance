"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { AdminSectionTabs } from "@/components/layout/AdminSectionTabs";
import { AiLocaleSyncPanel } from "@/components/admin/AiLocaleSyncPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  type AdminAccount,
  type AiDraft,
  type CourseOffering,
  type CourseOfferingBody,
  type CourseOfferingSlot,
  type CourseTemplate,
  type CourseTemplateBody,
  type ExternalRentalRequest,
  type ExternalRentalRequestBody,
  type FixedCourseImportDraft,
  type ScheduleBookingBody,
  type ScheduleBooking,
  type ScheduleBookingBatchItem,
  type ScheduleBookingType,
  type ScheduleCalendarEvent,
  type Studio,
  type StudioRoom,
  ApiRequestError,
  aiApi,
  unifiedScheduleApi,
  usersApi,
} from "@/lib/api";
import { hasPermission } from "@/lib/permissions";

type Locale = "zh" | "en" | "fr";
type Tab = "calendar" | "courses" | "bookings" | "pending" | "ai";
type AiCourseDraft = FixedCourseImportDraft & { createdTemplateId?: string };
type ScheduleConflictDetail = {
  code?: "teacher_conflict" | "room_conflict";
  teacher_name?: string;
  room_name?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
};
const copy = {
  zh: {
    title: "统一课程安排",
    calendar: "课程表",
    courses: "固定课程",
    bookings: "内部预约",
    pending: "待审核申请",
    resources: "教室资源",
    ai: "AI 批量导入",
    courseTemplates: "课程模板",
    newCourse: "新建课程",
    courseDetails: "课程资料",
    offerings: "学期开课安排",
    addOffering: "添加开课安排",
    term: "学期/安排名称",
    courseName: "课程名称",
    description: "课程说明",
    active: "启用",
    public: "公开显示",
    start: "开始日期",
    end: "结束日期",
    slots: "每周上课时段",
    addSlot: "添加时段",
    room: "教室",
    teacher: "负责人",
    noTeacher: "未指定负责人",
    save: "保存",
    cancel: "取消",
    delete: "删除",
    noCourses: "尚未建立课程模板",
    noOfferings: "尚未建立学期开课安排",
    studioName: "工作室/校区名称",
    roomName: "教室名称",
    addStudio: "添加工作室",
    addRoom: "添加教室",
    resourceHelp: "教室只在这里维护；固定课程只从这里选择资源。",
    batchHelp: "一次粘贴多行或多门课程。AI 只生成草稿，不会自动保存。",
    parse: "解析多个安排",
    drafts: "AI 草稿",
    review: "编辑并确认",
    loading: "加载中...",
    needConfirm: "请确认教室、负责人、学期名称和日期范围后保存。",
    confirmDelete: "确认删除？",
  },
  en: {
    title: "Unified Course Scheduling",
    calendar: "Calendar",
    courses: "Fixed Courses",
    bookings: "Internal Booking",
    pending: "Pending Requests",
    resources: "Studio Resources",
    ai: "AI Bulk Import",
    courseTemplates: "Course Templates",
    newCourse: "New Course",
    courseDetails: "Course Details",
    offerings: "Term Offerings",
    addOffering: "Add Term Offering",
    term: "Term / offering name",
    courseName: "Course name",
    description: "Course description",
    active: "Active",
    public: "Show publicly",
    start: "Start date",
    end: "End date",
    slots: "Weekly class slots",
    addSlot: "Add time slot",
    room: "Room",
    teacher: "Assigned teacher",
    noTeacher: "No assigned teacher",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    noCourses: "No course templates yet",
    noOfferings: "No term offerings yet",
    studioName: "Studio / location name",
    roomName: "Room name",
    addStudio: "Add studio",
    addRoom: "Add room",
    resourceHelp:
      "Manage rooms here; fixed courses select resources from this tab.",
    batchHelp:
      "Paste multiple lines or courses. AI creates drafts only and never saves automatically.",
    parse: "Parse schedules",
    drafts: "AI drafts",
    review: "Review and edit",
    loading: "Loading...",
    needConfirm:
      "Confirm room, teacher, term name, and date range before saving.",
    confirmDelete: "Delete this item?",
  },
  fr: {
    title: "Planification des cours",
    calendar: "Calendrier",
    courses: "Cours fixes",
    bookings: "Réservation interne",
    pending: "Demandes en attente",
    resources: "Ressources des salles",
    ai: "Import IA en lot",
    courseTemplates: "Modèles de cours",
    newCourse: "Nouveau cours",
    courseDetails: "Informations du cours",
    offerings: "Sessions",
    addOffering: "Ajouter une session",
    term: "Nom de la session",
    courseName: "Nom du cours",
    description: "Description du cours",
    active: "Active",
    public: "Afficher publiquement",
    start: "Date de début",
    end: "Date de fin",
    slots: "Horaires hebdomadaires",
    addSlot: "Ajouter un horaire",
    room: "Salle",
    teacher: "Responsable",
    noTeacher: "Aucun responsable",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    noCourses: "Aucun modèle de cours",
    noOfferings: "Aucune session",
    studioName: "Nom du studio / site",
    roomName: "Nom de la salle",
    addStudio: "Ajouter un studio",
    addRoom: "Ajouter une salle",
    resourceHelp:
      "Gérez les salles ici; les cours fixes choisissent ces ressources.",
    batchHelp:
      "Collez plusieurs lignes ou cours. L'IA ne crée que des brouillons et ne sauvegarde jamais automatiquement.",
    parse: "Analyser les horaires",
    drafts: "Brouillons IA",
    review: "Vérifier et modifier",
    loading: "Chargement...",
    needConfirm:
      "Confirmez la salle, le responsable, la session et les dates avant d'enregistrer.",
    confirmDelete: "Supprimer cet élément ?",
  },
} as const;
const dayNames = {
  zh: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
};
const isoToday = () => new Date().toISOString().slice(0, 10);
const addDays = (value: string, offset: number) => {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};
const startOfWeek = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return addDays(value, -date.getDay());
};
const startOfMonthGrid = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  return addDays(value.slice(0, 8) + "01", -date.getDay());
};
const timeRangesOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) => startA < endB && endA > startB;
const newSlot = (): CourseOfferingSlot => ({
  teacher_id: null,
  room_id: "",
  days_of_week: [1],
  start_time: "17:00",
  end_time: "18:00",
  sort_order: 0,
});
const newOffering = (): CourseOfferingBody => ({
  name: "",
  start_date: isoToday(),
  end_date: isoToday(),
  is_active: true,
  is_public: true,
  slots: [newSlot()],
});
const newTemplate = (): CourseTemplateBody => ({
  title: "",
  description: "",
  is_active: true,
  allow_unassigned_teacher: false,
  allow_unassigned_room: false,
  translations: {},
});
const newBooking = (): ScheduleBookingBody => ({
  room_id: "",
  teacher_id: null,
  date: isoToday(),
  start_time: "17:00",
  end_time: "18:00",
  booking_type: "rehearsal",
  title: "",
  student_name: "",
  participant_count: 0,
  notes: "",
  is_public: false,
});
const bookingTypes: Array<{
  value: ScheduleBookingType;
  zh: string;
  en: string;
  fr: string;
  adminOnly?: boolean;
}> = [
  { value: "solo", zh: "独舞", en: "Solo", fr: "Solo" },
  { value: "duet", zh: "双人舞", en: "Duet", fr: "Duo" },
  { value: "trio", zh: "三人舞", en: "Trio", fr: "Trio" },
  { value: "group", zh: "群舞", en: "Group", fr: "Groupe" },
  { value: "rehearsal", zh: "排练", en: "Rehearsal", fr: "Repetition" },
  {
    value: "makeup",
    zh: "补课",
    en: "Makeup class",
    fr: "Cours de rattrapage",
  },
  { value: "private", zh: "私教", en: "Private lesson", fr: "Cours prive" },
  {
    value: "external_rental",
    zh: "外部租用",
    en: "External rental",
    fr: "Location externe",
    adminOnly: true,
  },
  {
    value: "room_lock",
    zh: "教室锁定",
    en: "Room lock",
    fr: "Blocage de salle",
    adminOnly: true,
  },
];

export default function AdminSchedulesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale: Locale =
    pathname.split("/")[1] === "fr"
      ? "fr"
      : pathname.split("/")[1] === "en"
        ? "en"
        : "zh";
  const t = copy[locale];
  const aiDraftText = locale === "zh"
    ? { create: "创建关闭草稿", created: "已创建关闭草稿", draft: "AI 草稿", warning: "警告", unassignedTeacher: "允许暂未指定负责人", unassignedRoom: "允许暂未指定教室", noWarnings: "AI 草稿没有缺失字段警告" }
    : locale === "fr"
      ? { create: "Créer un brouillon désactivé", created: "Brouillon désactivé créé", draft: "Brouillon IA", warning: "Avertissements", unassignedTeacher: "Autoriser sans responsable", unassignedRoom: "Autoriser sans salle", noWarnings: "Aucun champ manquant signalé par l’IA" }
      : { create: "Create inactive draft", created: "Inactive draft created", draft: "AI draft", warning: "Warnings", unassignedTeacher: "Allow no assigned teacher", unassignedRoom: "Allow no assigned room", noWarnings: "No missing-field warnings from AI" };
  const courseAiText = locale === "zh"
    ? {
        title: "AI 翻译当前课程",
        description: "只读取中文课程名称和说明，生成 English 和 Français；不会修改开课安排、教师、教室或开关。",
        generated: "当前课程的英文和法文草稿已生成。",
        applied: "英文和法文已应用到当前课程，请检查后保存。",
      }
    : locale === "fr"
      ? {
          title: "Traduire ce cours avec l’IA",
          description: "Utilise uniquement le nom et la description en chinois pour générer l’anglais et le français, sans modifier les horaires, le responsable, la salle ni les options.",
          generated: "Les brouillons anglais et français de ce cours sont prêts.",
          applied: "L’anglais et le français ont été appliqués à ce cours. Vérifiez puis enregistrez.",
        }
      : {
          title: "AI translate this course",
          description: "Uses only the Chinese course name and description to generate English and French. Offerings, teachers, rooms, and switches are unchanged.",
          generated: "English and French drafts for this course are ready.",
          applied: "English and French were applied to this course. Review and save.",
        };
  const offeringCountText = (count: number) => locale === "zh"
    ? `${count} 学期开课安排`
    : locale === "fr"
      ? `${count} ${count === 1 ? "session" : "sessions"}`
      : `${count} ${count === 1 ? "term offering" : "term offerings"}`;
  const draftWarningMessage = (issue: { field?: string; message: string }) => {
    const labels: Record<string, Record<Locale, string>> = {
      "template.title": { zh: "课程名称缺失", en: "Course name is missing", fr: "Le nom du cours est manquant" },
      title: { zh: "课程名称缺失", en: "Course name is missing", fr: "Le nom du cours est manquant" },
      date_range: { zh: "课程日期范围缺失或无效", en: "Course date range is missing or invalid", fr: "La période du cours est manquante ou invalide" },
      teacher_id: { zh: "负责人未指定或未匹配到教师昵称", en: "Responsible teacher is not assigned or matched", fr: "Le responsable n’est pas attribué ou reconnu" },
      room_id: { zh: "教室未指定或未匹配", en: "Room is not assigned or matched", fr: "La salle n’est pas attribuée ou reconnue" },
      time: { zh: "上课星期或时间缺失或无效", en: "Weekly days or times are missing or invalid", fr: "Les jours ou les heures sont manquants ou invalides" },
      days_of_week: { zh: "上课星期缺失", en: "Weekly days are missing", fr: "Les jours de cours sont manquants" },
      slots: { zh: "至少需要一个每周上课时段", en: "At least one weekly course time is required", fr: "Au moins un horaire hebdomadaire est requis" },
      "offering.name": { zh: "学期名称根据课程日期推断，请核实", en: "The term name was inferred from the course dates; please verify it", fr: "Le nom de la session a été déduit des dates du cours; veuillez le vérifier" },
    };
    return (issue.field && labels[issue.field]?.[locale]) || issue.message;
  };
  const accountNickname = (account: AdminAccount) => {
    const localizedNickname =
      locale === "fr"
        ? account.nickname_fr
        : locale === "en"
          ? account.nickname_en
          : account.nickname_zh;
    const nickname =
      localizedNickname?.trim() ||
      account.nickname_zh?.trim() ||
      account.nickname_en?.trim() ||
      account.nickname_fr?.trim() ||
      account.first_name?.trim();
    if (nickname) return nickname;
    return account.role === "super_admin"
      ? locale === "zh"
        ? "超级管理员（未设置昵称）"
        : locale === "fr"
          ? "Super administrateur (sans surnom)"
          : "Super administrator (no nickname)"
      : locale === "zh"
        ? "老师（未设置昵称）"
        : locale === "fr"
          ? "Enseignant (sans surnom)"
      : "Teacher (no nickname)";
  };
  const formatScheduleConflict = (err: unknown) => {
    if (!(err instanceof ApiRequestError) || !err.details || typeof err.details !== "object")
      return err instanceof Error ? err.message : "Unable to save schedule changes";

    const detail = err.details as ScheduleConflictDetail;
    const room = detail.room_name || t.room;
    const time = detail.start_time && detail.end_time
      ? `${detail.start_time}-${detail.end_time}`
      : locale === "zh" ? "重叠时段" : locale === "fr" ? "creneau qui se chevauche" : "overlapping time";

    if (detail.code === "teacher_conflict") {
      const teacher = detail.teacher_name || t.noTeacher;
      return locale === "zh"
        ? `负责人时间冲突：${teacher} 在 ${room} 已有 ${time} 安排。教室空闲不影响负责人不能同时上课的规则。`
        : locale === "fr"
          ? `Conflit du responsable : ${teacher} a deja un cours de ${time} dans ${room}. Une salle libre ne permet pas a un responsable d assurer deux cours en meme temps.`
          : `Teacher conflict: ${teacher} already has a ${time} class in ${room}. An available room does not allow a teacher to lead two classes at once.`;
    }

    if (detail.code === "room_conflict") {
      return locale === "zh"
        ? `教室时间冲突：${room} 在 ${time} 已有安排。`
        : locale === "fr"
          ? `Conflit de salle : ${room} est deja occupee de ${time}.`
          : `Room conflict: ${room} is already occupied from ${time}.`;
    }

    return err.message;
  };
  const [tab, setTab] = useState<Tab>("courses");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [courses, setCourses] = useState<CourseTemplate[]>([]);
  const [selected, setSelected] = useState<CourseTemplate | null>(null);
  const [courseForm, setCourseForm] = useState(newTemplate);
  const [editLanguage, setEditLanguage] = useState<Locale>("zh");
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [offeringForm, setOfferingForm] = useState(newOffering);
  const [editingOfferingId, setEditingOfferingId] = useState<string | null>(
    null,
  );
  const [rooms, setRooms] = useState<StudioRoom[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [teachers, setTeachers] = useState<AdminAccount[]>([]);
  const [canManageResources, setCanManageResources] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminAccount | null>(null);
  const [canManageFixed, setCanManageFixed] = useState(false);
  const [canManageCalendar, setCanManageCalendar] = useState(false);
  const [canManageBookings, setCanManageBookings] = useState(false);
  const [canUseAi, setCanUseAi] = useState(false);
  const [resourceBusy, setResourceBusy] = useState(false);
  const [studioInput, setStudioInput] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [roomStudio, setRoomStudio] = useState("");
  const [bookingForm, setBookingForm] =
    useState<ScheduleBookingBody>(newBooking);
  const [bookingEvents, setBookingEvents] = useState<ScheduleCalendarEvent[]>(
    [],
  );
  const [bookingSaving, setBookingSaving] = useState(false);
  const [pendingBookings, setPendingBookings] = useState<ScheduleBooking[]>([]);
  const [rentalRequests, setRentalRequests] = useState<ExternalRentalRequest[]>([]);
  const [rentalRequestStatus, setRentalRequestStatus] = useState<"pending" | "confirmed" | "rejected" | "cancelled">("pending");
  const [editingRentalId, setEditingRentalId] = useState<string | null>(null);
  const [rentalEditForm, setRentalEditForm] = useState<ExternalRentalRequestBody | null>(null);
  const [reviewingBookingId, setReviewingBookingId] = useState<string | null>(null);
  const [conflictRequestOpen, setConflictRequestOpen] = useState(false);
  const [coordinationMessage, setCoordinationMessage] = useState("");
  const [coordinationSaving, setCoordinationSaving] = useState(false);
  const [calendarMode, setCalendarMode] = useState<"week" | "month">("week");
  const [calendarDate, setCalendarDate] = useState(isoToday);
  const [calendarEvents, setCalendarEvents] = useState<ScheduleCalendarEvent[]>([]);
  const [selectedCalendarBooking, setSelectedCalendarBooking] = useState<ScheduleBooking | null>(null);
  const [dayEditorDate, setDayEditorDate] = useState<string | null>(null);
  const [dayEditorBookings, setDayEditorBookings] = useState<ScheduleBooking[]>([]);
  const [dayEditorSaving, setDayEditorSaving] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkDrafts, setBulkDrafts] = useState<AiCourseDraft[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [creatingDraftIndex, setCreatingDraftIndex] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const me = await usersApi.me();
      setCurrentUser(me);
      const fixedVisible = hasPermission(me, "teaching.schedules.fixed");
      const studioVisible = hasPermission(me, "system.studio");
      const [nextCourses, nextRooms, nextStudios] = await Promise.all([
        fixedVisible ? unifiedScheduleApi.courseTemplates() : Promise.resolve([]),
        unifiedScheduleApi.resources(),
        studioVisible ? unifiedScheduleApi.studios() : Promise.resolve([]),
      ]);
      setCourses(nextCourses);
      setRooms(nextRooms);
      setStudios(nextStudios.filter((studio) => studio.is_active));
      setCanManageFixed(hasPermission(me, "teaching.schedules.fixed", "manage"));
      setCanManageCalendar(hasPermission(me, "teaching.schedules.calendar", "manage"));
      setCanManageBookings(hasPermission(me, "teaching.schedules.bookings", "manage"));
      setCanUseAi(hasPermission(me, "teaching.schedules.ai", "manage"));
      setCanManageResources(hasPermission(me, "teaching.schedules.calendar", "manage"));
      setTeachers([me]);
      setBookingForm((current) =>
        current.teacher_id ? current : { ...current, teacher_id: me.id },
      );
      if (me.role === "super_admin") {
        const accounts = await usersApi.adminAccounts({
          limit: 100,
          status: "active",
        });
        setTeachers(
          [me, ...accounts.items].filter(
            (account, index, all) =>
              all.findIndex((candidate) => candidate.id === account.id) ===
              index,
          ),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [locale]);
  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (requestedTab === "bookings") setTab(requestedTab);
  }, [searchParams]);
  useEffect(() => {
    if (!currentUser) return;
    const permissionKey = `teaching.schedules.${tab === "courses" ? "fixed" : tab}`;
    if (hasPermission(currentUser, permissionKey)) return;
    const first = (["calendar", "courses", "bookings", "ai"] as Tab[]).find((item) => hasPermission(currentUser, `teaching.schedules.${item === "courses" ? "fixed" : item}`));
    if (first) setTab(first);
  }, [currentUser, tab]);
  useEffect(() => {
    if (selected)
      unifiedScheduleApi
        .courseOfferings(selected.id)
        .then(setOfferings)
        .catch((err) =>
          setError(err instanceof Error ? err.message : "Load failed"),
        );
    else setOfferings([]);
  }, [selected?.id]);
  const loadBookingAvailability = async (dateToQuery = bookingForm.date) => {
    try {
      setBookingEvents(
        await unifiedScheduleApi.calendar(dateToQuery, dateToQuery),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load room availability",
      );
    }
  };
  useEffect(() => {
    if (tab === "bookings") void loadBookingAvailability();
  }, [tab, bookingForm.date]);
  const loadPendingBookings = async () => {
    if (!canManageResources) return;
    const start = addDays(isoToday(), -90);
    const end = addDays(isoToday(), 180);
    try {
      const bookings = await unifiedScheduleApi.bookings(start, end);
      setPendingBookings(bookings.filter((item) => item.status === "pending"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load pending bookings");
    }
  };
  useEffect(() => {
    if (tab === "bookings" && canManageResources) void loadPendingBookings();
  }, [tab, canManageResources]);
  const loadRentalRequests = async (status = rentalRequestStatus) => {
    if (!canManageResources) return;
    try {
      setRentalRequests(await unifiedScheduleApi.externalRentalRequests(status));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load rental requests");
    }
  };
  useEffect(() => {
    if (tab === "pending" && canManageResources) void loadRentalRequests();
  }, [tab, canManageResources, rentalRequestStatus]);
  const calendarRange = () => {
    const start = calendarMode === "week" ? startOfWeek(calendarDate) : startOfMonthGrid(calendarDate);
    return { start, end: addDays(start, calendarMode === "week" ? 6 : 41) };
  };
  const loadCalendar = async () => {
    const range = calendarRange();
    try {
      setCalendarEvents(await unifiedScheduleApi.calendar(range.start, range.end));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load calendar");
    }
  };
  useEffect(() => {
    if (tab === "calendar") void loadCalendar();
  }, [tab, calendarDate, calendarMode]);
  const chooseCourse = (course: CourseTemplate | null) => {
    setSelected(course);
    setCourseForm(
      course
        ? {
            title: course.title,
            description: course.description,
            is_active: course.is_active,
            translations: course.translations || {},
            allow_unassigned_teacher: course.allow_unassigned_teacher || false,
            allow_unassigned_room: course.allow_unassigned_room || false,
          }
        : newTemplate(),
    );
    setOfferingForm(newOffering());
    setEditingOfferingId(null);
  };
  const localField = (field: "title" | "description") =>
    editLanguage === "zh"
      ? courseForm[field]
      : courseForm.translations?.[editLanguage]?.[field] || "";
  const setLocalField = (field: "title" | "description", value: string) =>
    setCourseForm((current) =>
      editLanguage === "zh"
        ? { ...current, [field]: value }
        : {
            ...current,
            translations: {
              ...(current.translations || {}),
              [editLanguage]: {
                ...(current.translations?.[editLanguage] || {}),
                [field]: value,
              },
            },
          },
    );
  const applyCourseAi = (drafts: AiDraft[]) =>
    setCourseForm((current) => {
      const translations = { ...(current.translations || {}) };
      drafts.forEach((draft) => {
        if (draft.locale !== "en" && draft.locale !== "fr") return;
        const fields = draft.fields || {};
        translations[draft.locale] = {
          ...(translations[draft.locale] || {}),
          ...(fields.title?.trim() ? { title: fields.title } : {}),
          ...(fields.description?.trim()
            ? { description: fields.description }
            : {}),
        };
      });
      return { ...current, translations };
    });
  const saveCourse = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const saved = selected
        ? await unifiedScheduleApi.updateCourseTemplate(selected.id, courseForm)
        : await unifiedScheduleApi.createCourseTemplate(courseForm);
      await load();
      chooseCourse(saved);
      setNotice(t.save);
    } catch (err) {
      setError(formatScheduleConflict(err));
    }
  };
  const toggleListedCourse = async (course: CourseTemplate) => {
    if (!canManageFixed) return;
    setError("");
    const nextForm: CourseTemplateBody = {
      title: course.title,
      description: course.description,
      is_active: !course.is_active,
      translations: course.translations || {},
      allow_unassigned_teacher: course.allow_unassigned_teacher || false,
      allow_unassigned_room: course.allow_unassigned_room || false,
    };
    try {
      const saved = await unifiedScheduleApi.updateCourseTemplate(course.id, nextForm);
      setCourses((current) =>
        current.map((item) => (item.id === saved.id ? saved : item)),
      );
      if (selected?.id === saved.id) chooseCourse(saved);
      setNotice(saved.is_active ? (locale === "zh" ? "固定课程已启用" : locale === "fr" ? "Cours fixe active" : "Fixed course enabled") : (locale === "zh" ? "固定课程已停用，相关时段已释放。" : locale === "fr" ? "Cours fixe desactive. Les creneaux sont liberes." : "Fixed course disabled and its time slots have been released."));
    } catch (err) {
      setError(formatScheduleConflict(err));
    }
  };
  const updateSlot = (index: number, patch: Partial<CourseOfferingSlot>) =>
    setOfferingForm((current) => ({
      ...current,
      slots: current.slots.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
  const saveOffering = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setError("");
    try {
      if (editingOfferingId)
        await unifiedScheduleApi.updateCourseOffering(
          editingOfferingId,
          offeringForm,
        );
      else
        await unifiedScheduleApi.createCourseOffering(
          selected.id,
          offeringForm,
        );
      setOfferings(await unifiedScheduleApi.courseOfferings(selected.id));
      setOfferingForm(newOffering());
      setEditingOfferingId(null);
      load();
    } catch (err) {
      setError(formatScheduleConflict(err));
    }
  };
  const resourceMessage = (kind: "saved" | "archived" | "permission") =>
    locale === "zh"
      ? kind === "saved"
        ? "已保存"
        : kind === "archived"
          ? "该资源保留了历史排课，已停用并从排课中移除。"
          : "只有超级管理员可以管理教室资源。"
      : locale === "fr"
        ? kind === "saved"
          ? "Enregistre"
          : kind === "archived"
            ? "Cette ressource contient un historique et a ete desactivee."
            : "Seul le super administrateur peut gerer les ressources."
        : kind === "saved"
          ? "Saved"
          : kind === "archived"
            ? "This resource has scheduling history and was deactivated."
            : "Only a super administrator can manage studio resources.";
  const resourceError = (err: unknown) =>
    setError(
      err instanceof Error ? err.message : "Unable to update studio resources",
    );
  const createStudio = async () => {
    if (!studioInput.trim() || resourceBusy) return;
    setResourceBusy(true);
    setError("");
    try {
      const studio = await unifiedScheduleApi.createStudio({
        name: studioInput.trim(),
        is_active: true,
      });
      setStudioInput("");
      setRoomStudio(studio.id);
      setNotice(resourceMessage("saved"));
      await load();
    } catch (err) {
      resourceError(err);
    } finally {
      setResourceBusy(false);
    }
  };
  const createRoom = async () => {
    if (!roomStudio || !roomInput.trim() || resourceBusy) return;
    setResourceBusy(true);
    setError("");
    try {
      await unifiedScheduleApi.createRoom({
        studio_id: roomStudio,
        name: roomInput.trim(),
        is_active: true,
        is_rentable: false,
        sort_order: rooms.length,
      });
      setRoomInput("");
      setNotice(resourceMessage("saved"));
      await load();
    } catch (err) {
      resourceError(err);
    } finally {
      setResourceBusy(false);
    }
  };
  const removeRoom = async (room: StudioRoom) => {
    if (!confirm(t.confirmDelete) || resourceBusy) return;
    setResourceBusy(true);
    setError("");
    try {
      await unifiedScheduleApi.removeRoom(room.id);
      setNotice(resourceMessage("saved"));
    } catch (err) {
      try {
        await unifiedScheduleApi.updateRoom(room.id, {
          ...room,
          is_active: false,
        });
        setNotice(resourceMessage("archived"));
      } catch (archiveError) {
        resourceError(archiveError);
      }
    } finally {
      await load();
      setResourceBusy(false);
    }
  };
  const setRoomRentable = async (room: StudioRoom, checked: boolean) => {
    if (!canManageResources || resourceBusy) return;
    setResourceBusy(true);
    setError("");
    try {
      await unifiedScheduleApi.updateRoom(room.id, { ...room, is_rentable: checked });
      setNotice(resourceMessage("saved"));
      await load();
    } catch (err) {
      resourceError(err);
    } finally {
      setResourceBusy(false);
    }
  };
  const removeStudio = async (studio: Studio) => {
    if (!confirm(t.confirmDelete) || resourceBusy) return;
    setResourceBusy(true);
    setError("");
    try {
      await unifiedScheduleApi.removeStudio(studio.id);
      setNotice(resourceMessage("saved"));
    } catch (err) {
      try {
        await unifiedScheduleApi.updateStudio(studio.id, {
          ...studio,
          is_active: false,
        });
        setNotice(resourceMessage("archived"));
      } catch (archiveError) {
        resourceError(archiveError);
      }
    } finally {
      await load();
      setResourceBusy(false);
    }
  };
  const saveBooking = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManageBookings) return;
    setBookingSaving(true);
    setError("");
    try {
      await unifiedScheduleApi.createBooking(bookingForm);
      setConflictRequestOpen(false);
      setBookingForm((current) => ({
        ...newBooking(),
        date: current.date,
        room_id: current.room_id,
        teacher_id: current.teacher_id,
      }));
      setNotice(
        locale === "zh"
          ? "预约已确认"
          : locale === "fr"
            ? "Reservation confirmee"
            : "Booking confirmed",
      );
      await loadBookingAvailability(bookingForm.date);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create booking";
      setError(message);
      setConflictRequestOpen(message.startsWith("409:"));
    } finally {
      setBookingSaving(false);
    }
  };
  const submitCoordinationRequest = async () => {
    setCoordinationSaving(true);
    try {
      await unifiedScheduleApi.createCoordination({
        requested_date: bookingForm.date,
        requested_room_id: bookingForm.room_id || null,
        requested_start_time: bookingForm.start_time,
        requested_end_time: bookingForm.end_time,
        message: coordinationMessage.trim() || bookingForm.title,
      });
      setConflictRequestOpen(false);
      setCoordinationMessage("");
      setError("");
      setNotice(locale === "zh" ? "协调申请已提交给管理员，尚未占用教室。" : locale === "fr" ? "La demande a ete envoyee a l administrateur et n occupe pas la salle." : "The coordination request was sent to an administrator and does not reserve the room.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit request");
    } finally {
      setCoordinationSaving(false);
    }
  };
  const openCalendarBooking = async (item: ScheduleCalendarEvent) => {
    if (!canManageCalendar) return;
    if (item.source !== "booking") {
      setNotice(locale === "zh" ? "固定课程请在“固定课程”中修改每周安排。" : locale === "fr" ? "Modifiez les cours fixes dans l onglet Cours fixes." : "Edit fixed courses from the Fixed Courses tab.");
      return;
    }
    try {
      const bookingId = item.id.replace("booking:", "");
      const bookings = await unifiedScheduleApi.bookings(item.date, item.date);
      const booking = bookings.find((candidate) => candidate.id === bookingId);
      if (!booking) return;
      setSelectedCalendarBooking(booking);
      setBookingForm({ room_id: booking.room_id, teacher_id: booking.teacher_id || null, date: booking.date, start_time: booking.start_time, end_time: booking.end_time, booking_type: booking.booking_type, title: booking.title, student_name: booking.student_name, participant_count: booking.participant_count, notes: booking.notes, is_public: booking.is_public });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open booking");
    }
  };
  const saveCalendarBooking = async () => {
    if (!selectedCalendarBooking) return;
    setBookingSaving(true);
    try {
      await unifiedScheduleApi.updateBooking(selectedCalendarBooking.id, bookingForm);
      setSelectedCalendarBooking(null);
      setNotice(locale === "zh" ? "预约已更新" : locale === "fr" ? "Reservation mise a jour" : "Booking updated");
      await loadCalendar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update booking");
    } finally {
      setBookingSaving(false);
    }
  };
  const cancelCalendarBooking = async () => {
    if (!selectedCalendarBooking || !confirm(locale === "zh" ? "确认取消这项预约？" : locale === "fr" ? "Annuler cette reservation ?" : "Cancel this booking?")) return;
    setBookingSaving(true);
    try {
      await unifiedScheduleApi.cancelBooking(selectedCalendarBooking.id);
      setSelectedCalendarBooking(null);
      setNotice(locale === "zh" ? "预约已取消，教室时段已释放。" : locale === "fr" ? "Reservation annulee. Le creneau est libere." : "Booking cancelled and the room time has been released.");
      await loadCalendar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel booking");
    } finally {
      setBookingSaving(false);
    }
  };
  const openDayEditor = async (date: string) => {
    if (!canManageCalendar) return;
    try {
      const bookings = await unifiedScheduleApi.bookings(date, date);
      setDayEditorDate(date);
      setDayEditorBookings(bookings.filter((item) => item.status === "confirmed"));
      setSelectedCalendarBooking(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load daily bookings");
    }
  };
  const updateDayBooking = (id: string, patch: Partial<ScheduleBooking>) => {
    setDayEditorBookings((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  };
  const saveDayBookings = async () => {
    if (!dayEditorBookings.length) return;
    setDayEditorSaving(true);
    setError("");
    try {
      const items: ScheduleBookingBatchItem[] = dayEditorBookings.map((item) => ({ id: item.id, booking: { room_id: item.room_id, teacher_id: item.teacher_id || null, date: item.date, start_time: item.start_time, end_time: item.end_time, booking_type: item.booking_type, title: item.title, student_name: item.student_name, participant_count: item.participant_count, notes: item.notes, is_public: item.is_public } }));
      await unifiedScheduleApi.batchUpdateBookings(items);
      setDayEditorDate(null);
      setDayEditorBookings([]);
      setNotice(locale === "zh" ? "当天课程已整体保存并通过冲突检查。" : locale === "fr" ? "Les cours de la journee ont ete enregistres apres verification des conflits." : "The day's courses were saved after conflict validation.");
      await loadCalendar();
    } catch (err) {
      setError(formatScheduleConflict(err));
    } finally {
      setDayEditorSaving(false);
    }
  };
  const parseBulk = async () => {
    setAiLoading(true);
    setError("");
    try {
      const result = await aiApi.fixedCourseImport({
        source_locale: locale,
        ui_locale: locale,
        raw_text: bulkText,
        max_items: 30,
      });
      setBulkDrafts(result.drafts);
      if (result.warnings.length) setNotice(result.warnings.join(" "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI failed");
    } finally {
      setAiLoading(false);
    }
  };
  const createAiDraft = async (draft: AiCourseDraft, index: number) => {
    if (!canUseAi || creatingDraftIndex !== null) return;
    setCreatingDraftIndex(index);
    setError("");
    try {
      const saved = await unifiedScheduleApi.createCourseDraft(draft);
      setBulkDrafts((current) => current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, createdTemplateId: saved.id } : item,
      ));
      setCourses((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.title.localeCompare(b.title)));
      setNotice(aiDraftText.created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create fixed course draft");
    } finally {
      setCreatingDraftIndex(null);
    }
  };
  const courseTab = (
    <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.courseTemplates}</CardTitle>
          <Button type="button" size="icon" disabled={!canManageFixed} onClick={() => chooseCourse(null)}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {courses.length ? (
            courses.map((course) => (
              <div key={course.id} className={`flex w-full items-center gap-2 rounded-md border p-3 ${selected?.id === course.id ? "border-primary bg-primary/5" : "bg-white"}`}>
                <button type="button" onClick={() => chooseCourse(course)} className="min-w-0 flex-1 text-left"><strong className="block truncate">{course.title}</strong><p className="mt-1 text-xs text-muted-foreground">{offeringCountText(course.offering_count)}</p>{course.is_ai_draft && <div className="mt-1 flex flex-wrap gap-1"><span className="rounded bg-violet-100 px-1.5 py-0.5 text-[11px] text-violet-800">{aiDraftText.draft}</span>{Boolean(course.unresolved_question_count) && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-800">{aiDraftText.warning} {course.unresolved_question_count}</span>}</div>}</button>
                <Switch checked={course.is_active} disabled={!canManageFixed} onCheckedChange={() => void toggleListedCourse(course)} aria-label={locale === "zh" ? "切换固定课程状态" : "Toggle fixed course status"} />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t.noCourses}</p>
          )}
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <BookOpen className="mr-2 inline h-5 w-5" />
              {t.courseDetails}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={saveCourse}>
              <div className="flex gap-2">
                {(["zh", "en", "fr"] as Locale[]).map((item) => (
                  <Button
                    key={item}
                    type="button"
                    size="sm"
                    variant={editLanguage === item ? "default" : "outline"}
                    onClick={() => setEditLanguage(item)}
                  >
                    {item === "zh"
                      ? "中文"
                      : item === "en"
                        ? "English"
                        : "Français"}
                  </Button>
                ))}
              </div>
              {canUseAi && canManageFixed && (
                <AiLocaleSyncPanel
                  key={`fixed-course-ai-${selected?.id || "new"}`}
                  module="schedules"
                  sourceLocale="zh"
                  targetLocales={["en", "fr"]}
                  uiLocale={locale}
                  fields={{
                    title: courseForm.title,
                    description: courseForm.description,
                  }}
                  onApply={applyCourseAi}
                  title={courseAiText.title}
                  description={courseAiText.description}
                  labels={{
                    generated: courseAiText.generated,
                    applied: courseAiText.applied,
                  }}
                  compact
                />
              )}
              <Input
                required={editLanguage === "zh"}
                value={localField("title")}
                placeholder={t.courseName}
                onChange={(e) => setLocalField("title", e.target.value)}
              />
              <Textarea
                value={localField("description")}
                placeholder={t.description}
                onChange={(e) => setLocalField("description", e.target.value)}
              />
              {selected && canManageFixed && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex min-h-11 items-center gap-2 rounded-md border bg-slate-50 px-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(courseForm.allow_unassigned_teacher)}
                      onChange={(e) => setCourseForm((current) => ({ ...current, allow_unassigned_teacher: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {aiDraftText.unassignedTeacher}
                  </label>
                  <label className="flex min-h-11 items-center gap-2 rounded-md border bg-slate-50 px-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(courseForm.allow_unassigned_room)}
                      onChange={(e) => setCourseForm((current) => ({ ...current, allow_unassigned_room: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {aiDraftText.unassignedRoom}
                  </label>
                </div>
              )}
              {selected?.is_ai_draft && (
                <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                  {[...(selected.draft_questions || []), ...(selected.draft_assumptions || [])].length ? (
                    [...(selected.draft_questions || []), ...(selected.draft_assumptions || [])].map((issue) => (
                      <div key={`${issue.field}-${issue.message}`} className="flex items-start gap-2 text-amber-900">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{draftWarningMessage(issue)}</span>
                      </div>
                    ))
                  ) : <span className="text-emerald-700">{aiDraftText.noWarnings}</span>}
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {t.save}
                </Button>
                {selected && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      if (confirm(t.confirmDelete)) {
                        await unifiedScheduleApi.removeCourseTemplate(
                          selected.id,
                        );
                        chooseCourse(null);
                        load();
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t.delete}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
        {selected && renderOfferingEditor()}
      </div>
    </div>
  );
  function renderOfferingEditor() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.offerings}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            {offerings.length ? (
              offerings.map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <strong>{item.name}</strong>
                      <p className="text-xs text-muted-foreground">
                        {item.start_date} - {item.end_date}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingOfferingId(item.id);
                          setOfferingForm({
                            name: item.name,
                            start_date: item.start_date,
                            end_date: item.end_date,
                            is_active: item.is_active,
                            is_public: item.is_public,
                            slots: item.slots,
                          });
                        }}
                      >
                        {t.review}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={async () => {
                          if (confirm(t.confirmDelete)) {
                            await unifiedScheduleApi.removeCourseOffering(
                              item.id,
                            );
                            if (selected)
                              setOfferings(
                                await unifiedScheduleApi.courseOfferings(
                                  selected.id,
                                ),
                              );
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  {item.slots.map((slotItem, index) => (
                    <p
                      key={index}
                      className="mt-1 text-xs text-muted-foreground"
                    >
                      {slotItem.days_of_week
                        .map((day) => dayNames[locale][day])
                        .join(" / ")}{" "}
                      · {slotItem.start_time}-{slotItem.end_time}
                    </p>
                  ))}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{t.noOfferings}</p>
            )}
          </div>
          <form className="space-y-3 border-t pt-4" onSubmit={saveOffering}>
            <h3 className="font-semibold">
              {editingOfferingId ? t.review : t.addOffering}
            </h3>
            <Input
              required
              value={offeringForm.name}
              placeholder={t.term}
              onChange={(e) =>
                setOfferingForm((x) => ({ ...x, name: e.target.value }))
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="date"
                value={offeringForm.start_date}
                onChange={(e) =>
                  setOfferingForm((x) => ({ ...x, start_date: e.target.value }))
                }
              />
              <Input
                type="date"
                value={offeringForm.end_date}
                onChange={(e) =>
                  setOfferingForm((x) => ({ ...x, end_date: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-4 text-sm">
              <label>
                <input
                  type="checkbox"
                  checked={offeringForm.is_active}
                  onChange={(e) =>
                    setOfferingForm((x) => ({
                      ...x,
                      is_active: e.target.checked,
                    }))
                  }
                />{" "}
                {t.active}
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={offeringForm.is_public}
                  onChange={(e) =>
                    setOfferingForm((x) => ({
                      ...x,
                      is_public: e.target.checked,
                    }))
                  }
                />{" "}
                {t.public}
              </label>
            </div>
            <p className="font-medium text-sm">{t.slots}</p>
            {offeringForm.slots.map((slotItem, index) =>
              renderSlotEditor(index, slotItem),
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setOfferingForm((x) => ({
                  ...x,
                  slots: [
                    ...x.slots,
                    { ...newSlot(), sort_order: x.slots.length },
                  ],
                }))
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.addSlot}
            </Button>
            <div className="flex gap-2">
              <Button type="submit">{t.save}</Button>
              {editingOfferingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingOfferingId(null);
                    setOfferingForm(newOffering());
                  }}
                >
                  {t.cancel}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }
  function renderSlotEditor(index: number, slotItem: CourseOfferingSlot) {
    return (
      <div key={index} className="space-y-3 rounded-md border bg-slate-50 p-3">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="h-10 rounded-md border bg-white px-3 text-sm"
            required={!courseForm.allow_unassigned_room}
            value={slotItem.room_id || ""}
            onChange={(e) => updateSlot(index, { room_id: e.target.value || null })}
          >
            <option value="">{t.room}</option>
            {rooms
              .filter((room) => room.is_active)
              .map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
          </select>
          <select
            className="h-10 rounded-md border bg-white px-3 text-sm"
            value={slotItem.teacher_id || ""}
            onChange={(e) =>
              updateSlot(index, { teacher_id: e.target.value || null })
            }
          >
            <option value="">{t.noTeacher}</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {accountNickname(teacher)}
              </option>
            ))}
          </select>
          <Input
            type="time"
            value={slotItem.start_time}
            onChange={(e) => updateSlot(index, { start_time: e.target.value })}
          />
          <Input
            type="time"
            value={slotItem.end_time}
            onChange={(e) => updateSlot(index, { end_time: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {dayNames[locale].map((label, day) => (
            <label key={label} className="text-sm">
              <input
                type="checkbox"
                checked={slotItem.days_of_week.includes(day)}
                onChange={() => {
                  const next = slotItem.days_of_week.includes(day)
                    ? slotItem.days_of_week.filter((n) => n !== day)
                    : [...slotItem.days_of_week, day].sort();
                  if (next.length) updateSlot(index, { days_of_week: next });
                }}
              />{" "}
              {label}
            </label>
          ))}
        </div>
        {offeringForm.slots.length > 1 && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              setOfferingForm((x) => ({
                ...x,
                slots: x.slots.filter((_, i) => i !== index),
              }))
            }
          >
            {t.delete}
          </Button>
        )}
      </div>
    );
  }
  const selectedRoomName = rooms.find((room) => room.id === bookingForm.room_id)?.name || t.room;
  const selectedTeacher = teachers.find((teacher) => teacher.id === bookingForm.teacher_id);
  const selectedTeacherName = selectedTeacher ? accountNickname(selectedTeacher) : t.noTeacher;
  const selectedRoomConflicts = bookingEvents.filter((item) =>
    item.room_id === bookingForm.room_id &&
    timeRangesOverlap(bookingForm.start_time, bookingForm.end_time, item.start_time, item.end_time),
  );
  const selectedTeacherConflicts = bookingForm.teacher_id
    ? bookingEvents.filter((item) =>
        item.teacher_id === bookingForm.teacher_id &&
        timeRangesOverlap(bookingForm.start_time, bookingForm.end_time, item.start_time, item.end_time),
      )
    : [];
  const conflictIsTeacher = error.includes("Teacher is unavailable") || selectedTeacherConflicts.length > 0;
  const teacherConflict = selectedTeacherConflicts[0];
  const teacherConflictRoom = teacherConflict
    ? teacherConflict.room_name || rooms.find((room) => room.id === teacherConflict.room_id)?.name || t.room
    : "";
  const bookingConflictText = conflictIsTeacher
    ? locale === "zh"
      ? `负责人时间冲突：${selectedTeacherName} 在 ${teacherConflictRoom || "另一项课程"} 已有 ${teacherConflict ? `${teacherConflict.start_time}-${teacherConflict.end_time}` : "重叠"} 安排。教室空闲不影响负责人不能同时上课的规则。`
      : locale === "fr"
        ? `Conflit du responsable : ${selectedTeacherName} a deja un cours ${teacherConflict ? `${teacherConflict.start_time}-${teacherConflict.end_time}` : "qui se chevauche"} dans ${teacherConflictRoom || "une autre salle"}.`
        : `Teacher conflict: ${selectedTeacherName} already has a ${teacherConflict ? `${teacherConflict.start_time}-${teacherConflict.end_time}` : "overlapping"} class in ${teacherConflictRoom || "another room"}.`
    : locale === "zh"
      ? `教室时间冲突：${selectedRoomName} 在该时段已有安排。`
      : locale === "fr"
        ? `Conflit de salle : ${selectedRoomName} est deja occupee pendant ce creneau.`
        : `Room conflict: ${selectedRoomName} is already occupied during this time.`;
  const bookingTab = (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "zh"
              ? "新建内部预约"
              : locale === "fr"
                ? "Nouvelle reservation interne"
                : "New internal booking"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={saveBooking}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span>
                  {locale === "zh" ? "日期" : locale === "fr" ? "Date" : "Date"}
                </span>
                <Input
                  required
                  type="date"
                  value={bookingForm.date}
                  onChange={(e) =>
                    setBookingForm((current) => ({
                      ...current,
                      date: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>{t.room}</span>
                <select
                  required
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                  value={bookingForm.room_id}
                  onChange={(e) =>
                    setBookingForm((current) => ({
                      ...current,
                      room_id: e.target.value,
                    }))
                  }
                >
                  <option value="">
                    {locale === "zh"
                      ? "选择教室"
                      : locale === "fr"
                        ? "Choisir une salle"
                        : "Select a room"}
                  </option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span>
                  {locale === "zh"
                    ? "预约类型"
                    : locale === "fr"
                      ? "Type"
                      : "Booking type"}
                </span>
                <select
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                  value={bookingForm.booking_type}
                  onChange={(e) =>
                    setBookingForm((current) => ({
                      ...current,
                      booking_type: e.target.value as ScheduleBookingType,
                    }))
                  }
                >
                  {bookingTypes
                    .filter((type) => canManageResources || !type.adminOnly)
                    .map((type) => (
                      <option key={type.value} value={type.value}>
                        {type[locale]}
                      </option>
                    ))}
                </select>
              </label>
              {canManageResources ? (
                <label className="space-y-1 text-sm">
                  <span>{t.teacher}</span>
                  <select
                    className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                    value={bookingForm.teacher_id || ""}
                    onChange={(e) =>
                      setBookingForm((current) => ({
                        ...current,
                        teacher_id: e.target.value || null,
                      }))
                    }
                  >
                    <option value="">{t.noTeacher}</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {accountNickname(teacher)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div />
              )}
              <label className="space-y-1 text-sm">
                <span>
                  {locale === "zh"
                    ? "开始时间"
                    : locale === "fr"
                      ? "Heure de debut"
                      : "Start time"}
                </span>
                <Input
                  required
                  type="time"
                  value={bookingForm.start_time}
                  onChange={(e) =>
                    setBookingForm((current) => ({
                      ...current,
                      start_time: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>
                  {locale === "zh"
                    ? "结束时间"
                    : locale === "fr"
                      ? "Heure de fin"
                      : "End time"}
                </span>
                <Input
                  required
                  type="time"
                  value={bookingForm.end_time}
                  onChange={(e) =>
                    setBookingForm((current) => ({
                      ...current,
                      end_time: e.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <Input
              required
              value={bookingForm.title}
              placeholder={
                locale === "zh"
                  ? "预约名称"
                  : locale === "fr"
                    ? "Titre de la reservation"
                    : "Booking title"
              }
              onChange={(e) =>
                setBookingForm((current) => ({
                  ...current,
                  title: e.target.value,
                }))
              }
            />
            <Input
              value={bookingForm.student_name}
              placeholder={
                locale === "zh"
                  ? "学生姓名（可选，仅后台）"
                  : locale === "fr"
                    ? "Nom de l eleve (facultatif, interne)"
                    : "Student name (optional, internal only)"
              }
              onChange={(e) =>
                setBookingForm((current) => ({
                  ...current,
                  student_name: e.target.value,
                }))
              }
            />
            <Textarea
              value={bookingForm.notes}
              placeholder={
                locale === "zh"
                  ? "备注（可选，仅后台）"
                  : locale === "fr"
                    ? "Notes (facultatif, interne)"
                    : "Notes (optional, internal only)"
              }
              onChange={(e) =>
                setBookingForm((current) => ({
                  ...current,
                  notes: e.target.value,
                }))
              }
            />
            <label className="flex items-start gap-2 rounded-md border bg-slate-50 p-3 text-sm"><input type="checkbox" className="mt-0.5" checked={bookingForm.is_public} onChange={(e) => setBookingForm((current) => ({ ...current, is_public: e.target.checked }))} /><span><span className="block font-medium">{locale === "zh" ? "在公开课表显示" : locale === "fr" ? "Afficher dans le calendrier public" : "Show on the public schedule"}</span><span className="block text-xs text-muted-foreground">{locale === "zh" ? "仅显示预约名称、日期、时间和教室；不显示负责人、学生和备注。" : locale === "fr" ? "Seuls le titre, la date, l heure et la salle seront affiches." : "Only the title, date, time, and room will be shown."}</span></span></label>
            <Button
              type="submit"
              disabled={!canManageBookings || bookingSaving || rooms.length === 0}
            >
              {bookingSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {locale === "zh"
                ? "确认预约"
                : locale === "fr"
                  ? "Confirmer la reservation"
                  : "Confirm booking"}
            </Button>
          </form>
          {conflictRequestOpen && (
            <div className="mt-4 space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">{bookingConflictText}</p>
              <Textarea value={coordinationMessage} placeholder={locale === "zh" ? "申请说明（可选）" : locale === "fr" ? "Message facultatif" : "Optional message"} onChange={(e) => setCoordinationMessage(e.target.value)} />
              <Button type="button" variant="outline" disabled={coordinationSaving} onClick={submitCoordinationRequest}>{coordinationSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{locale === "zh" ? "提交协调申请" : locale === "fr" ? "Envoyer la demande" : "Submit coordination request"}</Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "zh"
              ? "当天教室占用"
              : locale === "fr"
                ? "Occupation du jour"
                : "Today's room occupancy"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{bookingForm.date}</p>
          {bookingForm.room_id && (
            <p className={selectedRoomConflicts.length ? "text-sm text-amber-800" : "text-sm text-emerald-700"}>
              {selectedRoomConflicts.length
                ? locale === "zh"
                  ? `${selectedRoomName} 在所选时段已占用。`
                  : locale === "fr"
                    ? `${selectedRoomName} est occupee pendant le creneau choisi.`
                    : `${selectedRoomName} is occupied during the selected time.`
                : locale === "zh"
                  ? `${selectedRoomName} 在所选时段空闲。`
                  : locale === "fr"
                    ? `${selectedRoomName} est libre pendant le creneau choisi.`
                    : `${selectedRoomName} is free during the selected time.`}
            </p>
          )}
          {selectedTeacherConflicts.length > 0 && (
            <p className="text-sm text-amber-800">
              {locale === "zh"
                ? `${selectedTeacherName} 在 ${teacherConflictRoom} 的 ${teacherConflict?.start_time}-${teacherConflict?.end_time} 已有安排。`
                : locale === "fr"
                  ? `${selectedTeacherName} a deja un cours dans ${teacherConflictRoom} de ${teacherConflict?.start_time} a ${teacherConflict?.end_time}.`
                  : `${selectedTeacherName} already has a class in ${teacherConflictRoom} from ${teacherConflict?.start_time} to ${teacherConflict?.end_time}.`}
            </p>
          )}
          {bookingEvents.length === 0 ? (
            <p className="pt-3 text-sm text-muted-foreground">
              {locale === "zh"
                ? "所选日期暂无已确认占用。"
                : locale === "fr"
                  ? "Aucune occupation confirmee ce jour."
                  : "No confirmed room use on this date."}
            </p>
          ) : (
            <div className="pt-2 space-y-2">
              {bookingEvents
                .slice()
                .sort((a, b) =>
                  `${a.room_id}${a.start_time}`.localeCompare(
                    `${b.room_id}${b.start_time}`,
                  ),
                )
                .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border bg-slate-50 p-3 text-sm"
                  >
                    <p className="font-medium">
                      {item.room_name ||
                        rooms.find((room) => room.id === item.room_id)?.name ||
                        t.room}
                    </p>
                    <p className="text-muted-foreground">
                      {item.start_time} - {item.end_time}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.source === "fixed"
                        ? locale === "zh"
                          ? "固定课程"
                          : locale === "fr"
                            ? "Cours fixe"
                            : "Fixed course"
                        : locale === "zh"
                          ? "内部预约"
                          : locale === "fr"
                            ? "Reservation interne"
                            : "Internal booking"}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  const calendarRangeValue = calendarRange();
  const calendarDays = Array.from({ length: calendarMode === "week" ? 7 : 42 }, (_, index) => addDays(calendarRangeValue.start, index));
  const calendarTab = (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{locale === "zh" ? "课程表" : locale === "fr" ? "Calendrier" : "Schedule"}</CardTitle>
          <div className="flex w-full flex-wrap items-center justify-end gap-2"><Button title={locale === "zh" ? "上一段" : "Previous"} aria-label={locale === "zh" ? "上一段" : "Previous"} type="button" size="icon" variant="outline" onClick={() => setCalendarDate((value) => addDays(value, calendarMode === "week" ? -7 : -28))}><ChevronLeft className="h-4 w-4" /></Button><Input className="w-[150px] max-w-full" type="date" value={calendarDate} onChange={(e) => setCalendarDate(e.target.value)} /><Button title={locale === "zh" ? "下一段" : "Next"} aria-label={locale === "zh" ? "下一段" : "Next"} type="button" size="icon" variant="outline" onClick={() => setCalendarDate((value) => addDays(value, calendarMode === "week" ? 7 : 28))}><ChevronRight className="h-4 w-4" /></Button><div className="flex rounded-md border p-1"><Button type="button" size="sm" variant={calendarMode === "week" ? "default" : "ghost"} onClick={() => setCalendarMode("week")}>{locale === "zh" ? "周" : locale === "fr" ? "Semaine" : "Week"}</Button><Button type="button" size="sm" variant={calendarMode === "month" ? "default" : "ghost"} onClick={() => setCalendarMode("month")}>{locale === "zh" ? "月" : locale === "fr" ? "Mois" : "Month"}</Button></div></div>
        </CardHeader>
        <CardContent><div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border bg-border">{dayNames[locale].map((day) => <div key={day} className="bg-muted px-2 py-2 text-center text-xs font-medium">{day}</div>)}{calendarDays.map((day) => <div key={day} className={`min-h-32 bg-white p-2 ${calendarMode === "month" && day.slice(0, 7) !== calendarDate.slice(0, 7) ? "opacity-50" : ""}`}><button type="button" onClick={() => void openDayEditor(day)} className="mb-2 text-xs font-medium text-foreground underline-offset-2 hover:text-primary hover:underline">{day.slice(5)}</button><div className="space-y-1">{calendarEvents.filter((item) => item.date === day).sort((a, b) => a.start_time.localeCompare(b.start_time)).map((item) => <button key={item.id} type="button" onClick={() => void openCalendarBooking(item)} className={`block w-full rounded px-2 py-1 text-left text-xs ${item.source === "fixed" ? "bg-blue-100 text-blue-900" : "bg-emerald-100 text-emerald-900"}`}><span className="block font-medium">{item.start_time}-{item.end_time}</span><span className="block truncate">{item.room_name || rooms.find((room) => room.id === item.room_id)?.name || t.room}</span><span className="block truncate">{item.title}</span></button>)}</div></div>)}</div></CardContent>
      </Card>
      {canManageResources && dayEditorDate && <Card><CardHeader><CardTitle>{locale === "zh" ? `编辑 ${dayEditorDate} 当天课程` : locale === "fr" ? `Modifier les cours du ${dayEditorDate}` : `Edit courses for ${dayEditorDate}`}</CardTitle></CardHeader><CardContent className="space-y-4">{calendarEvents.some((item) => item.date === dayEditorDate && item.source === "fixed") && <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{locale === "zh" ? "当天的固定课程保持只读；如需取消或改期，请在固定课程中设置日期例外。" : locale === "fr" ? "Les cours fixes restent en lecture seule. Utilisez une exception de date pour les modifier." : "Fixed courses remain read-only here. Use a date exception to change them."}</p>}{dayEditorBookings.length === 0 ? <p className="text-sm text-muted-foreground">{locale === "zh" ? "当天没有可批量编辑的已确认内部预约。" : locale === "fr" ? "Aucune reservation interne confirmee a modifier." : "No confirmed internal bookings to edit on this day."}</p> : <div className="space-y-3">{dayEditorBookings.map((item) => <div key={item.id} className="grid gap-2 rounded-md border bg-slate-50 p-3 md:grid-cols-4"><select className="h-10 rounded-md border bg-white px-3 text-sm" value={item.room_id} onChange={(e) => updateDayBooking(item.id, { room_id: e.target.value })}>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select><Input value={item.title} onChange={(e) => updateDayBooking(item.id, { title: e.target.value })} /><Input type="time" value={item.start_time} onChange={(e) => updateDayBooking(item.id, { start_time: e.target.value })} /><Input type="time" value={item.end_time} onChange={(e) => updateDayBooking(item.id, { end_time: e.target.value })} /></div>)}</div>}<div className="flex flex-wrap gap-2"><Button type="button" disabled={!dayEditorBookings.length || dayEditorSaving} onClick={saveDayBookings}>{dayEditorSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{locale === "zh" ? "保存当天修改" : locale === "fr" ? "Enregistrer la journee" : "Save day changes"}</Button><Button type="button" variant="outline" disabled={dayEditorSaving} onClick={() => { setDayEditorDate(null); setDayEditorBookings([]); }}>{t.cancel}</Button></div></CardContent></Card>}
      {canManageResources && selectedCalendarBooking && <Card><CardHeader><CardTitle>{locale === "zh" ? "编辑内部预约" : locale === "fr" ? "Modifier la reservation" : "Edit internal booking"}</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><select className="h-10 rounded-md border bg-white px-3 text-sm" value={bookingForm.room_id} onChange={(e) => setBookingForm((current) => ({ ...current, room_id: e.target.value }))}>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select><Input type="date" value={bookingForm.date} onChange={(e) => setBookingForm((current) => ({ ...current, date: e.target.value }))} aria-label={locale === "zh" ? "预约日期" : "Booking date"} /><Input className="md:col-span-2" value={bookingForm.title} onChange={(e) => setBookingForm((current) => ({ ...current, title: e.target.value }))} placeholder={locale === "zh" ? "预约名称" : "Booking title"} /><Input type="time" value={bookingForm.start_time} onChange={(e) => setBookingForm((current) => ({ ...current, start_time: e.target.value }))} /><Input type="time" value={bookingForm.end_time} onChange={(e) => setBookingForm((current) => ({ ...current, end_time: e.target.value }))} /><div className="flex flex-wrap gap-2 md:col-span-2"><Button type="button" disabled={bookingSaving} onClick={saveCalendarBooking}>{locale === "zh" ? "保存修改" : locale === "fr" ? "Enregistrer" : "Save changes"}</Button><Button type="button" variant="destructive" className="bg-red-600 text-white hover:bg-red-700" disabled={bookingSaving} onClick={cancelCalendarBooking}>{locale === "zh" ? "取消预约" : locale === "fr" ? "Annuler la reservation" : "Cancel booking"}</Button><Button type="button" variant="outline" onClick={() => setSelectedCalendarBooking(null)}>{t.cancel}</Button></div></CardContent></Card>}
    </div>
  );
  const beginRentalEdit = (item: ExternalRentalRequest) => {
    setEditingRentalId(item.id);
    setRentalEditForm({
      room_id: item.room_id,
      request_mode: item.request_mode,
      date: item.date,
      start_date: item.start_date,
      end_date: item.end_date,
      days_of_week: item.days_of_week,
      start_time: item.start_time,
      end_time: item.end_time,
      title: item.title,
      applicant_name: item.applicant_name,
      applicant_contact: item.applicant_contact,
      notes: item.notes,
    });
  };
  const saveRentalEdit = async () => {
    if (!editingRentalId || !rentalEditForm || resourceBusy) return;
    setResourceBusy(true);
    setError("");
    try {
      await unifiedScheduleApi.updateExternalRentalRequest(editingRentalId, rentalEditForm);
      setEditingRentalId(null);
      setRentalEditForm(null);
      setNotice(locale === "zh" ? "申请已更新" : locale === "fr" ? "Demande mise à jour" : "Request updated");
      await loadRentalRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update rental request");
    } finally {
      setResourceBusy(false);
    }
  };
  const reviewRentalRequest = async (item: ExternalRentalRequest, action: "approve" | "reject" | "cancel") => {
    if (resourceBusy) return;
    setResourceBusy(true);
    setError("");
    try {
      if (action === "approve") await unifiedScheduleApi.approveExternalRentalRequest(item.id);
      if (action === "reject") await unifiedScheduleApi.rejectExternalRentalRequest(item.id);
      if (action === "cancel") await unifiedScheduleApi.cancelExternalRentalRequest(item.id);
      setNotice(locale === "zh" ? "申请状态已更新" : locale === "fr" ? "Statut de la demande mis à jour" : "Request status updated");
      await loadRentalRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update rental request");
    } finally {
      setResourceBusy(false);
    }
  };
  const rentalRequestLabel = (item: ExternalRentalRequest) => {
    if (item.request_mode === "single") return `${item.date || ""} ${item.start_time}-${item.end_time}`;
    return `${item.start_date || ""} - ${item.end_date || ""} · ${item.days_of_week.map((day) => dayNames[locale][day]).join(", ")} · ${item.start_time}-${item.end_time}`;
  };
  const pendingTab = (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>{t.pending}</CardTitle>
        <select className="h-10 rounded-md border bg-background px-3 text-sm" value={rentalRequestStatus} onChange={(event) => setRentalRequestStatus(event.target.value as typeof rentalRequestStatus)}>
          <option value="pending">{locale === "zh" ? "待审核" : locale === "fr" ? "En attente" : "Pending"}</option>
          <option value="confirmed">{locale === "zh" ? "已确认" : locale === "fr" ? "Confirmées" : "Confirmed"}</option>
          <option value="rejected">{locale === "zh" ? "已拒绝" : locale === "fr" ? "Refusées" : "Rejected"}</option>
          <option value="cancelled">{locale === "zh" ? "已取消" : locale === "fr" ? "Annulées" : "Cancelled"}</option>
        </select>
      </CardHeader>
      <CardContent>
        {!canManageResources ? <p className="text-sm text-muted-foreground">{resourceMessage("permission")}</p> : rentalRequests.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{locale === "zh" ? "暂无申请" : locale === "fr" ? "Aucune demande" : "No requests"}</p> : <div className="space-y-3">{rentalRequests.map((item) => <div key={item.id} className="rounded-md border p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="space-y-1 text-sm"><div className="font-semibold">{item.title}</div><div className="text-muted-foreground">{rentalRequestLabel(item)}</div><div className="text-muted-foreground">{rooms.find((room) => room.id === item.room_id)?.name || item.room_id}</div><div>{item.applicant_name} · {item.applicant_contact}</div>{item.notes && <div className="whitespace-pre-wrap text-muted-foreground">{item.notes}</div>}{editingRentalId === item.id && rentalEditForm && <div className="mt-3 grid gap-2 rounded-md border bg-slate-50 p-3 md:grid-cols-2"><select className="h-10 rounded-md border bg-white px-3 text-sm" value={rentalEditForm.room_id} onChange={(event) => setRentalEditForm((current) => current ? { ...current, room_id: event.target.value } : current)}>{rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select>{rentalEditForm.request_mode === "single" ? <Input type="date" value={rentalEditForm.date || ""} onChange={(event) => setRentalEditForm((current) => current ? { ...current, date: event.target.value } : current)} /> : <><Input type="date" value={rentalEditForm.start_date || ""} onChange={(event) => setRentalEditForm((current) => current ? { ...current, start_date: event.target.value } : current)} /><Input type="date" value={rentalEditForm.end_date || ""} onChange={(event) => setRentalEditForm((current) => current ? { ...current, end_date: event.target.value } : current)} /></>}<Input type="time" value={rentalEditForm.start_time} onChange={(event) => setRentalEditForm((current) => current ? { ...current, start_time: event.target.value } : current)} /><Input type="time" value={rentalEditForm.end_time} onChange={(event) => setRentalEditForm((current) => current ? { ...current, end_time: event.target.value } : current)} /><div className="flex gap-2 md:col-span-2"><Button type="button" size="sm" disabled={resourceBusy} onClick={() => void saveRentalEdit()}>{locale === "zh" ? "保存修改" : locale === "fr" ? "Enregistrer" : "Save changes"}</Button><Button type="button" size="sm" variant="outline" onClick={() => { setEditingRentalId(null); setRentalEditForm(null); }}>{t.cancel}</Button></div></div>}</div><div className="flex flex-wrap gap-2">{item.status === "pending" && <><Button type="button" size="sm" variant="outline" onClick={() => beginRentalEdit(item)}>{locale === "zh" ? "修改" : locale === "fr" ? "Modifier" : "Edit"}</Button><Button type="button" size="sm" disabled={resourceBusy} onClick={() => void reviewRentalRequest(item, "approve")}>{locale === "zh" ? "确认" : locale === "fr" ? "Confirmer" : "Approve"}</Button><Button type="button" size="sm" variant="outline" disabled={resourceBusy} onClick={() => void reviewRentalRequest(item, "reject")}>{locale === "zh" ? "拒绝" : locale === "fr" ? "Refuser" : "Reject"}</Button></>}{item.status === "confirmed" && <Button type="button" size="sm" variant="outline" disabled={resourceBusy} onClick={() => void reviewRentalRequest(item, "cancel")}>{locale === "zh" ? "取消租用" : locale === "fr" ? "Annuler" : "Cancel"}</Button>}</div></div></div>)}</div>}
      </CardContent>
    </Card>
  );
  const resourceTab = (
    <Card>
      <CardHeader>
        <CardTitle>{t.resources}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">{t.resourceHelp}</p>
        {!canManageResources && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {resourceMessage("permission")}
          </div>
        )}
        <section className="rounded-md border bg-slate-50/60 p-4">
          <label className="mb-2 block text-sm font-medium">
            {t.studioName}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              disabled={!canManageResources || resourceBusy}
              value={studioInput}
              placeholder={t.studioName}
              onChange={(e) => setStudioInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createStudio();
                }
              }}
            />
            <Button
              type="button"
              disabled={
                !canManageResources || !studioInput.trim() || resourceBusy
              }
              onClick={createStudio}
            >
              {resourceBusy && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t.addStudio}
            </Button>
          </div>
        </section>
        {studios.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {locale === "zh"
              ? "尚未建立工作室。先添加一个工作室，再在其中添加教室。"
              : locale === "fr"
                ? "Aucun studio. Ajoutez un studio, puis ses salles."
                : "No studio yet. Add a studio, then add its rooms."}
          </p>
        ) : (
          studios.map((studio) => (
            <section key={studio.id} className="rounded-md border p-4">
              <div className="flex items-center justify-between gap-3">
                <strong>{studio.name}</strong>
                <Button
                  title={t.delete}
                  aria-label={t.delete}
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={!canManageResources || resourceBusy}
                  onClick={() => removeStudio(studio)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {rooms
                  .filter((room) => room.studio_id === studio.id)
                  .map((room) => (
                    <div key={room.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
                      <span>{room.name}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Switch checked={room.is_rentable} disabled={!canManageResources || resourceBusy} onCheckedChange={(checked) => void setRoomRentable(room, checked)} />
                          {locale === "zh" ? "对外出租" : locale === "fr" ? "Location publique" : "Public rental"}
                        </label>
                        <Button title={t.delete} aria-label={t.delete} type="button" size="icon" variant="ghost" disabled={!canManageResources || resourceBusy} onClick={() => removeRoom(room)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
              {roomStudio === studio.id ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Input
                    disabled={!canManageResources || resourceBusy}
                    value={roomInput}
                    placeholder={t.roomName}
                    onChange={(e) => setRoomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        createRoom();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    disabled={
                      !canManageResources || !roomInput.trim() || resourceBusy
                    }
                    onClick={createRoom}
                  >
                    {resourceBusy && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t.addRoom}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={resourceBusy}
                    onClick={() => {
                      setRoomStudio("");
                      setRoomInput("");
                    }}
                  >
                    {t.cancel}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  className="mt-4"
                  size="sm"
                  variant="outline"
                  disabled={!canManageResources || resourceBusy}
                  onClick={() => setRoomStudio(studio.id)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t.addRoom}
                </Button>
              )}
            </section>
          ))
        )}
      </CardContent>
    </Card>
  );
  const aiTab = (
    <Card>
      <CardHeader>
        <CardTitle>{t.ai}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t.batchHelp}</p>
        <Textarea
          className="min-h-[220px]"
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
        />
        <Button
          type="button"
          disabled={!bulkText.trim() || aiLoading}
          onClick={parseBulk}
        >
          {aiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t.parse}
        </Button>
        {bulkDrafts.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold">{t.drafts}</h2>
            {bulkDrafts.map((draft, index) => (
              <div
                key={index}
                className="flex justify-between gap-3 rounded-md border p-3"
              >
                <div>
                  <strong>{draft.template.title || t.courseName}</strong>
                  <p className="text-sm text-muted-foreground">
                    {draft.offering.name || t.term} - {draft.offering.start_date || "-"} - {draft.offering.end_date || "-"}
                  </p>
                  {draft.slots.map((slot, slotIndex) => (
                    <p key={slotIndex} className="text-xs text-muted-foreground">
                      {slot.days_of_week.map((day) => dayNames[locale][day]).join(" / ") || "-"} - {slot.start_time || "-"}-{slot.end_time || "-"} - {rooms.find((room) => room.id === slot.room_id)?.name || t.room} - {teachers.find((teacher) => teacher.id === slot.teacher_id) ? accountNickname(teachers.find((teacher) => teacher.id === slot.teacher_id)!) : t.noTeacher}
                    </p>
                  ))}
                  {[...draft.questions, ...draft.assumptions].map((issue) => (
                    <p key={issue.id} className={issue.blocking ? "text-xs text-amber-700" : "text-xs text-muted-foreground"}>
                      {draftWarningMessage(issue)}
                    </p>
                  ))}
                </div>
                <Button
                  type="button"
                  variant={draft.createdTemplateId ? "outline" : "default"}
                  disabled={!canUseAi || Boolean(draft.createdTemplateId) || creatingDraftIndex !== null}
                  onClick={() => void createAiDraft(draft, index)}
                >
                  {creatingDraftIndex === index && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {draft.createdTemplateId ? aiDraftText.created : aiDraftText.create}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <AdminSectionTabs />
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <CalendarDays className="h-6 w-6 text-primary" />
          {t.title}
        </h1>
        <div className="flex flex-wrap gap-2 border-b pb-2">
          {(["calendar", "courses", "bookings", "ai"] as Tab[]).filter((item) => currentUser && hasPermission(currentUser, `teaching.schedules.${item === "courses" ? "fixed" : item}`)).map((item) => (
            <Button
              key={item}
              type="button"
              variant={tab === item ? "default" : "ghost"}
              onClick={() => setTab(item)}
            >
              {t[item]}
            </Button>
          ))}
        </div>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {conflictRequestOpen && error.startsWith("409:") ? bookingConflictText : error}
          </div>
        )}
        {notice && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {notice}
          </div>
        )}
        {loading ? (
          <p className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.loading}
          </p>
        ) : tab === "calendar" ? (
          calendarTab
        ) : tab === "courses" ? (
          courseTab
        ) : tab === "ai" ? (
          aiTab
        ) : (
          bookingTab
        )}
      </main>
    </div>
  );
}
