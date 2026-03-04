import { Routes, Route } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import Home from '../Home/Home'
import UserProfile from '../UserProfile/UserProfile'
import Settings from '../Settings/Settings'
import RoleManagement from '../RoleManagement/RoleManagement'
import AssignmentManagement from '../AssignmentManagement/AssignmentManagement'
import ModuleManagement from '../ModuleManagement/ModuleManagement'
import UserManagement from '../UserManagement/UserManagement'
import UserActivation from '../UserActivation/UserActivation'
import './Dashboard.css'

const Dashboard = () => {
  return (
    <Layout>
      <div className="dashboard">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/rbac" element={<RoleManagement />} />
          <Route path="/assignment" element={<AssignmentManagement />} />
          <Route path="/dynamic" element={<ModuleManagement />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/user-activation" element={<UserActivation />} />
        </Routes>
      </div>
    </Layout>
  )
}

export default Dashboard
