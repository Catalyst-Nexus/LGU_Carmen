import { Routes, Route } from 'react-router-dom'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import UserProfile from '../UserProfile/UserProfile'
import Settings from '../Settings/Settings'
import RoleManagement from '../RoleManagement/RoleManagement'
import AssignmentManagement from '../AssignmentManagement/AssignmentManagement'
import ModuleManagement from '../ModuleManagement/ModuleManagement'
import UserManagement from '../UserManagement/UserManagement'
import UserActivation from '../UserActivation/UserActivation'
import {
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlineClipboardList,
  HiOutlineLightningBolt,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineKey,
  HiOutlineArrowSmRight,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCalendar,
  HiOutlineClock,
} from 'react-icons/hi'
import { FiActivity, FiCheckCircle, FiAlertCircle, FiUserPlus } from 'react-icons/fi'
import './Dashboard.css'

const DashboardHome = () => {
  // TODO: Replace with API call to fetch dashboard stats
  const stats = [
    {
      icon: HiOutlineUsers,
      value: '0',
      label: 'Total Users',
      trend: '+12%',
      trendUp: true,
      color: 'blue',
    },
    {
      icon: HiOutlineShieldCheck,
      value: '0',
      label: 'Active Roles',
      trend: '+3%',
      trendUp: true,
      color: 'green',
    },
    {
      icon: HiOutlineClipboardList,
      value: '0',
      label: 'Assignments',
      trend: '-2%',
      trendUp: false,
      color: 'purple',
    },
    {
      icon: HiOutlineLightningBolt,
      value: '0',
      label: 'Dynamic Modules',
      trend: '+8%',
      trendUp: true,
      color: 'orange',
    },
  ]

  const quickLinks = [
    {
      to: '/dashboard/profile',
      icon: HiOutlineUser,
      text: 'User Profile',
      description: 'View and edit your profile',
      color: 'green',
    },
    {
      to: '/dashboard/assignment',
      icon: HiOutlineClipboardList,
      text: 'Assignment Management',
      description: 'Manage user assignments',
      color: 'purple',
    },
    {
      to: '/dashboard/dynamic',
      icon: HiOutlineLightningBolt,
      text: 'Module Management',
      description: 'Configure system modules',
      color: 'orange',
    },
    {
      to: '/dashboard/rbac',
      icon: HiOutlineShieldCheck,
      text: 'Role Management',
      description: 'Manage roles and permissions',
      color: 'blue',
    },
    {
      to: '/dashboard/user-management',
      icon: HiOutlineUsers,
      text: 'User Management',
      description: 'Manage system users',
      color: 'teal',
    },
    {
      to: '/dashboard/user-activation',
      icon: HiOutlineKey,
      text: 'User Activation',
      description: 'Activate or deactivate users',
      color: 'pink',
    },
  ]

  const recentActivities = [
    {
      icon: FiUserPlus,
      title: 'New user registered',
      description: 'John Doe joined the system',
      time: '2 minutes ago',
      type: 'success',
    },
    {
      icon: FiCheckCircle,
      title: 'Role updated',
      description: 'Admin role permissions modified',
      time: '1 hour ago',
      type: 'info',
    },
    {
      icon: FiAlertCircle,
      title: 'Login attempt failed',
      description: 'Multiple failed login attempts detected',
      time: '3 hours ago',
      type: 'warning',
    },
  ]

  return (
    <div className="home">
      <div className="home-header">
        <div className="home-header-content">
          <h1 className="home-title">Dashboard Overview</h1>
          <p className="home-subtitle">Welcome back! Here's what's happening in your system.</p>
        </div>
        <div className="home-header-actions">
          <div className="date-display">
            <HiOutlineCalendar className="date-icon" />
            <span>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card stat-card-${stat.color}`}>
            <div className="stat-card-header">
              <div className={`stat-icon stat-icon-${stat.color}`}>
                <stat.icon />
              </div>
              <div className={`stat-trend ${stat.trendUp ? 'trend-up' : 'trend-down'}`}>
                {stat.trendUp ? <HiOutlineTrendingUp /> : <HiOutlineTrendingDown />}
                <span>{stat.trend}</span>
              </div>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-bar">
              <div className={`stat-bar-fill stat-bar-${stat.color}`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="quick-links-section">
          <div className="section-header">
            <h2 className="section-title">
              <HiOutlineCog className="section-icon" />
              Quick Actions
            </h2>
            <span className="section-badge">{quickLinks.length} modules</span>
          </div>
          <div className="links-grid">
            {quickLinks.map((link, index) => (
              <Link key={index} to={link.to} className={`link-card link-card-${link.color}`}>
                <div className={`link-icon link-icon-${link.color}`}>
                  <link.icon />
                </div>
                <div className="link-content">
                  <span className="link-text">{link.text}</span>
                  <span className="link-description">{link.description}</span>
                </div>
                <HiOutlineArrowSmRight className="link-arrow" />
              </Link>
            ))}
          </div>
        </div>

        <div className="activity-section">
          <div className="section-header">
            <h2 className="section-title">
              <FiActivity className="section-icon" />
              Recent Activity
            </h2>
            <button className="view-all-link">View All</button>
          </div>
          <div className="activity-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className={`activity-item activity-${activity.type}`}>
                <div className={`activity-icon activity-icon-${activity.type}`}>
                  <activity.icon />
                </div>
                <div className="activity-content">
                  <span className="activity-title">{activity.title}</span>
                  <span className="activity-description">{activity.description}</span>
                </div>
                <div className="activity-time">
                  <HiOutlineClock />
                  <span>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const Dashboard = () => {
  return (
    <Layout>
      <div className="dashboard">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
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
