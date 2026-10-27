import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { I18nProvider } from "@/i18n/I18nProvider";
import { loadCatalogue } from "@/i18n/catalogue";
import { SOURCE_LOCALE, t } from "@/i18n/t";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: t("CareCompanion") },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/brand/favicon-32.png" },
      { rel: "apple-touch-icon", href: "/brand/apple-touch-icon.png" },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang={SOURCE_LOCALE}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("cc.locale");
    } catch {
      stored = null;
    }
    void loadCatalogue(stored ?? SOURCE_LOCALE);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <Outlet />
      </I18nProvider>
    </QueryClientProvider>
  );
}
