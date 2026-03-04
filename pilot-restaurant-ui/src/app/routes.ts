import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/Dashboard";
import { DocumentsPage } from "./pages/Documents";
import { ComplianceCalendarPage } from "./pages/ComplianceCalendar";
import { InspectionAnalysisPage } from "./pages/InspectionAnalysis";
import { InspectionReadinessPage } from "./pages/InspectionReadiness";
import { ComplianceAssistantPage } from "./pages/ComplianceAssistant";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "documents", Component: DocumentsPage },
      { path: "calendar", Component: ComplianceCalendarPage },
      { path: "inspections", Component: InspectionAnalysisPage },
      { path: "readiness", Component: InspectionReadinessPage },
      { path: "assistant", Component: ComplianceAssistantPage },
    ],
  },
]);
