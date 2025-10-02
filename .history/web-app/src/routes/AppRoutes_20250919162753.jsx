import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import Chat from "../pages/Chat";
import Admin from "../pages/Admin";
import ProjectManager from "../pages/ProjectManager";
import TeamLead from "../pages/TeamLead";

const AppRoutes = ({ darkMode, onToggleDarkMode }) => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <Home darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
          } 
        />
        <Route 
          path="/profile" 
          element={
            <Profile darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
          } 
        />
        <Route 
          path="/chat" 
          element={
            <Chat darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
          } 
        />
        <Route 
          path="/admin" 
          element={
            <Admin darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
          } 
        />
        <Route 
          path="/project-manager" 
          element={
            <ProjectManager darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
          } 
        />
        <Route 
          path="/team-lead" 
          element={
            <TeamLead darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
          } 
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
