import { Route, Routes } from 'react-router-dom';

import { BusinessLayout } from './components/BusinessLayout';

import {

  RequireBusiness,

  RequireGuest,

  RequireUser,

  RootRedirect,

} from './components/RouteGuards';

import { ActivitiesPage } from './pages/ActivitiesPage';

import { AddEventPage } from './pages/AddEventPage';

import { AuthPage } from './pages/AuthPage';

import { CreateGroupPage } from './pages/CreateGroupPage';

import { CreateHubPage } from './pages/CreateHubPage';

import { CreatePackPage } from './pages/CreatePackPage';

import { CreateProjectPage } from './pages/CreateProjectPage';

import { EngagementDetailPage } from './pages/EngagementDetailPage';

import { EngagementsPage } from './pages/EngagementsPage';

import { CategoriesPage } from './pages/CategoriesPage';

import { CustomerDetailPage } from './pages/CustomerDetailPage';

import { CustomersPage } from './pages/CustomersPage';

import { DashboardPage } from './pages/DashboardPage';

import { EditEventPage } from './pages/EditEventPage';

import { InvoiceCreatePage } from './pages/InvoiceCreatePage';

import { InvoiceDetailPage } from './pages/InvoiceDetailPage';

import { InvoiceReportsPage } from './pages/InvoiceReportsPage';

import { InvoicesPage } from './pages/InvoicesPage';

import { LeadDetailPage } from './pages/LeadDetailPage';

import { LeadsPage } from './pages/LeadsPage';

import { MorePage } from './pages/MorePage';

import { OnboardingPage } from './pages/OnboardingPage';

import { AssistantPage } from './pages/AssistantPage';

import { SettingsAccountPage } from './pages/SettingsAccountPage';

import { ConnectionsPage } from './pages/ConnectionsPage';

import { SettingsAutomationPage } from './pages/SettingsAutomationPage';

import { SettingsBusinessPage } from './pages/SettingsBusinessPage';
import { MonthlyExpensesPage } from './pages/MonthlyExpensesPage';

import { SettingsDataPage } from './pages/SettingsDataPage';

import { SettingsHubPage } from './pages/SettingsHubPage';

import { ExternalFormsPage } from './pages/ExternalFormsPage';

import { ExternalFormConnectPage } from './pages/ExternalFormConnectPage';

import { ExternalFormManagePage } from './pages/ExternalFormManagePage';

import { TodayPage } from './pages/TodayPage';



export default function App() {

  return (

    <Routes>

      <Route path="/" element={<RootRedirect />} />



      <Route element={<RequireGuest />}>

        <Route path="/auth" element={<AuthPage />} />

      </Route>



      <Route element={<RequireUser />}>

        <Route path="/onboarding" element={<OnboardingPage />} />

      </Route>



      <Route element={<RequireUser />}>

        <Route element={<RequireBusiness />}>

          <Route element={<BusinessLayout />}>

          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/activities" element={<ActivitiesPage />} />

          <Route path="/more" element={<MorePage />} />

          <Route path="/today" element={<TodayPage />} />

          <Route path="/categories" element={<CategoriesPage />} />

          <Route path="/assistant" element={<AssistantPage />} />

          <Route path="/settings" element={<SettingsHubPage />} />

          <Route path="/settings/connections" element={<ConnectionsPage />} />

          <Route path="/settings/external-forms" element={<ExternalFormsPage />} />

          <Route path="/settings/external-forms/new" element={<ExternalFormConnectPage />} />

          <Route path="/settings/external-forms/:id" element={<ExternalFormManagePage />} />

          <Route path="/settings/business" element={<SettingsBusinessPage />} />

          <Route path="/settings/monthly-expenses" element={<MonthlyExpensesPage />} />

          <Route path="/settings/automation" element={<SettingsAutomationPage />} />

          <Route path="/settings/data" element={<SettingsDataPage />} />

          <Route path="/settings/account" element={<SettingsAccountPage />} />

          <Route path="/create" element={<CreateHubPage />} />

          <Route path="/create/event" element={<AddEventPage />} />

          <Route path="/create/pack" element={<CreatePackPage />} />

          <Route path="/create/project" element={<CreateProjectPage />} />

          <Route path="/create/group" element={<CreateGroupPage />} />

          <Route path="/engagements" element={<EngagementsPage />} />

          <Route path="/engagements/:id" element={<EngagementDetailPage />} />

          <Route path="/events/new" element={<AddEventPage />} />

          <Route path="/events/:id/edit" element={<EditEventPage />} />

          <Route path="/leads" element={<LeadsPage />} />

          <Route path="/leads/:id" element={<LeadDetailPage />} />

          <Route path="/customers" element={<CustomersPage />} />

          <Route path="/customers/:key" element={<CustomerDetailPage />} />

          <Route path="/invoices" element={<InvoicesPage />} />

          <Route path="/invoices/new" element={<InvoiceCreatePage />} />

          <Route path="/invoices/reports" element={<InvoiceReportsPage />} />

          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />

          </Route>

        </Route>

      </Route>

    </Routes>

  );

}


