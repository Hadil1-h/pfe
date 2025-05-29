import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import AjouterContact from "../pages/AjouterContact";
import CreateTaskPopup from "../pages/CreateTaskPopup";
import AjouterEntreprise from "../pages/AjouterEntreprise";
import TicketForm from "../pages/TicketForm";
import TicketFormContact from "../pages/TicketFormContact";
import DashboardProject from "../pages/DashboardProjects";
import DashboardAgent from "../dashBord/dashBordAgent";
import DashboardContact from "../dashBord/dashBordContact";
import Contacts from "../contacts";
import ContactPage from "../pages/ContactPage";
import EntreprisePage from "../pages/EntreprisePage";
import TableProject from "../pages/TableProject";
import CreateProject from '../pages/CreateProject';
import KanbanBoard from "../pages/KanbanBoard";
import EditProject from '../pages/EditProject';
import AddTask from "../pages/AddTask";
import ProjectTeam from "../pages/ProjectTeam";
import Timeline from "../pages/Timeline";
import StatistiquesInterface from "../pages/StatistiquesInterface";
import MessagingInterface from "../pages/MessagingInterface";
import DashboardAdmin from "../admin/DashboardAdmin";
import GeneralSettings from "../admin/settings/GeneralSettings";
import UserManagement from "../admin/settings/UserManagement";
import SecuritySettings from "../admin/settings/SecuritySettings";
import DatabaseSettings from "../admin/settings/DatabaseSettings";
import NotificationSettings from "../admin/settings/NotificationSettings";
import EmailSettings from "../admin/settings/EmailSettings";
import SystemLogs from "../admin/settings/SystemLogs";
import WorkflowSettings from "../admin/settings/WorkflowSettings";
import TasksByStatus from "../pages/TasksByStatus";
import AddTypeAndStatusPage from "../pages/AddTypeAndStatusPage";
import AIProjectReport from "../pages/AIProjectReport";
const AppRouter = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <p>Chargement...</p>;
  }

  // Normalisation du type d'utilisateur en minuscules pour éviter les problèmes de casse
  const userType = user?.typeUtilisateur?.toLowerCase() || user?.role?.toLowerCase();

  return (
    <Routes>
      {/* Route racine */}
      <Route path="/" element={
        !user ? <Navigate to="/login" /> : 
        userType === "agent" ? <Navigate to="/TasksByStatus" /> :
        userType === "admin" ? <Navigate to="/admin/dashboard" /> :
        <Navigate to="/dashboardContact" />
      } />

      {/* Routes non authentifiées */}
      {!user ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </>
      ) : (
        <>
          {/* Routes pour les admins (accès complet) */}
          {userType === "admin" && (
            <>
              <Route path="/admin/dashboard" element={<DashboardAdmin />} />
              <Route path="/admin/general" element={<GeneralSettings />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/security" element={<SecuritySettings />} />
              <Route path="/admin/database" element={<DatabaseSettings />} />
              <Route path="/admin/notifications" element={<NotificationSettings />} />
              <Route path="/admin/email" element={<EmailSettings />} />
              <Route path="/admin/logs" element={<SystemLogs />} />
              <Route path="/admin/workflow" element={<WorkflowSettings />} />
              
              <Route path="/contactPage" element={<ContactPage />} />
              <Route path="/entreprisePage" element={<EntreprisePage />} />
              <Route path="/dashboardAgent" element={<DashboardAgent />} />
              <Route path="/ajouter-contact" element={<AjouterContact />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/ajouter-entreprise" element={<AjouterEntreprise />} />
              <Route path="/ticket-form" element={<TicketForm />} />
              <Route path="/dashboardProject" element={<DashboardProject />} />
              <Route path="/tableProject" element={<TableProject />} />
              <Route path="/KanbanBoard" element={<KanbanBoard />} />
              <Route path="/TasksByStatus" element={<TasksByStatus />} />
              <Route path="/AddTask" element={<AddTask />} />
              <Route path="/projectTeam" element={<ProjectTeam />} />
              <Route path="/Timeline" element={<Timeline />} />
              <Route path="/StatistiquesInterface" element={<StatistiquesInterface />} />
              <Route path="/MessagingInterface" element={<MessagingInterface />} />
              <Route path="/AIProjectReport" element={<AIProjectReport />} />
              <Route path="/createProject" element={<CreateProject />} />
              <Route path="/editProject/:id" element={<EditProject />} />
              <Route path="/CreateTaskPopup" element={<CreateTaskPopup />} />
              <Route path="/AddTypeAndStatusPage" element={<AddTypeAndStatusPage />} />
            
              <Route path="*" element={<Navigate to="/admin/dashboard" />} />
            </>
          )}

          {/* Routes pour les agents (accès limité) */}
          {userType === "agent" && (
            <>
              <Route path="/MessagingInterface" element={<MessagingInterface />} />
              <Route path="/TasksByStatus" element={<TasksByStatus />} />
              <Route path="*" element={<Navigate to="/TasksByStatus" />} />
            </>
          )}

          {/* Routes pour les contacts */}
          {userType === "contact" && (
            <>
              <Route path="/dashboardContact" element={<DashboardContact />} />
              <Route path="/ticket-form" element={<TicketFormContact />} />
              <Route path="*" element={<Navigate to="/dashboardContact" />} />
            </>
          )}
        </>
      )}
    </Routes>
  );
};

export default AppRouter;

