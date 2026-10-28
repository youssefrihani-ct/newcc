import {
  Banknote, BarChart3, BookOpen, Building2, CalendarDays, ClipboardList, FileText, FileType, FlaskConical,
  Globe, House, Languages, LayoutDashboard, ListChecks, Mail, MapPin, MessageSquare, Plug, PenLine,
  Receipt, ScrollText, Shield, Sparkles, UserRound, Users, UsersRound, Wallet, Bell, CircleHelp, Ellipsis,
  type LucideIcon,
} from "lucide-react";
import { m } from "@/i18n/t";

// Navigation per role, from spec section 5. Items whose screen exists link to it; the others open the
// standard "not available yet" page until their phase builds them.

export type NavTarget = "/" | "/users" | "/team" | "/more" | null;
export type NavItem = { key: string; label: string; icon: LucideIcon; to: NavTarget };
export type NavSection = { title?: string; items: NavItem[] };

const dashboard: NavItem = { key: "dashboard", label: m("Dashboard"), icon: LayoutDashboard, to: "/" };
const reports: NavItem = { key: "reports", label: m("Reports"), icon: BarChart3, to: null };
const participants: NavItem = { key: "participants", label: m("Participants"), icon: UserRound, to: null };
const claims: NavItem = { key: "claims", label: m("Claims"), icon: Receipt, to: null };
const messages: NavItem = { key: "messages", label: m("Messages"), icon: Mail, to: null };
const visits: NavItem = { key: "visits", label: m("Visits"), icon: CalendarDays, to: null };
const claimRules: NavItem = { key: "claim-rules", label: m("Claim Rules"), icon: ListChecks, to: null };
const questionnaires: NavItem = { key: "questionnaires", label: m("Questionnaires"), icon: ClipboardList, to: null };

export const NAV: Record<string, NavSection[]> = {
  admin: [
    {
      items: [
        dashboard,
        { key: "studies", label: m("Studies"), icon: FlaskConical, to: null },
        { key: "clients", label: m("Clients"), icon: Building2, to: null },
        { key: "sites", label: m("Sites"), icon: MapPin, to: null },
        { key: "contracts", label: m("Contracts"), icon: FileText, to: null },
        claimRules,
      ],
    },
    {
      title: m("Platform"),
      items: [
        { key: "users", label: m("Users"), icon: Users, to: "/users" },
        { key: "faq", label: m("FAQ"), icon: CircleHelp, to: null },
        { key: "document-types", label: m("Document types"), icon: FileType, to: null },
        questionnaires,
        { key: "translations", label: m("Translations"), icon: Languages, to: null },
        { key: "integrations", label: m("Integrations"), icon: Plug, to: null },
        { key: "messaging-channels", label: m("Messaging channels"), icon: MessageSquare, to: null },
        { key: "ai-settings", label: m("AI settings"), icon: Sparkles, to: null },
        { key: "notifications", label: m("Notifications"), icon: Bell, to: null },
        { key: "signature-policy", label: m("Signature policy"), icon: PenLine, to: null },
        { key: "countries", label: m("Countries"), icon: Globe, to: null },
        reports,
        { key: "audit-log", label: m("Audit log"), icon: ScrollText, to: null },
        { key: "security-data", label: m("Security & data"), icon: Shield, to: null },
      ],
    },
  ],
  study_manager: [
    {
      items: [
        dashboard,
        { key: "studies", label: m("Studies"), icon: FlaskConical, to: null },
        { key: "sites", label: m("Sites"), icon: MapPin, to: null },
        participants,
        claims,
        { key: "contracts-funds", label: m("Contracts & funds"), icon: FileText, to: null },
        claimRules,
        questionnaires,
        reports,
        { key: "audit", label: m("Audit"), icon: ScrollText, to: null },
      ],
    },
  ],
  site_manager: [
    {
      items: [
        dashboard,
        participants,
        visits,
        claims,
        { key: "team", label: m("Team"), icon: UsersRound, to: "/team" },
        reports,
        messages,
      ],
    },
  ],
  crc: [{ items: [dashboard, participants, visits, claims, reports, messages] }],
  finance: [
    {
      items: [
        dashboard,
        { key: "claims-to-pay", label: m("Claims"), icon: Receipt, to: null },
        { key: "payment-schedule", label: m("Payment schedule"), icon: Wallet, to: null },
        { key: "payment-runs", label: m("Payment runs"), icon: Banknote, to: null },
        { key: "contracts-funds", label: m("Contracts & funds"), icon: FileText, to: null },
        reports,
      ],
    },
  ],
  // The auditor has no portal of its own (spec 2); read-only access arrives with the audit screens.
  auditor: [{ items: [dashboard] }],
};

// Participant app: bottom tab bar (spec 5, 19)
export const PARTICIPANT_TABS: NavItem[] = [
  { key: "home", label: m("Home"), icon: House, to: "/" },
  { key: "visits", label: m("Visits"), icon: CalendarDays, to: null },
  { key: "diary", label: m("Diary"), icon: BookOpen, to: null },
  { key: "claims", label: m("Claims"), icon: Receipt, to: null },
  { key: "more", label: m("More"), icon: Ellipsis, to: "/more" },
];

