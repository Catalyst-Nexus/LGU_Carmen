import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './UserProfile.css'
import { 
  HiOutlineUser, 
  HiOutlineMail, 
  HiOutlineIdentification,
  HiOutlineShieldCheck,
  HiOutlineCalendar,
  HiOutlineDeviceMobile,
  HiOutlineKey,
  HiOutlinePencil,
  HiOutlineCamera,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineXCircle,
  HiOutlineUserCircle,
  HiOutlinePhone
} from 'react-icons/hi'
import { FiActivity } from 'react-icons/fi'

const UserProfile = () => {
  const { user } = useAuth()
  const [showEditModal, setShowEditModal] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="user-profile">
      <div className="page-header">
        <h1 className="page-title">User Profile</h1>
        <p className="page-description">View and manage your profile information</p>
      </div>

      <div className="profile-layout">
        {/* Left Column - Profile Card */}
        <div className="profile-sidebar">
          <div className="profile-card profile-main-card">
            <div className="profile-avatar-container">
              <div className="profile-avatar-large">
                {user?.username ? getInitials(user.username) : 'U'}
              </div>
              <button className="avatar-edit-btn" title="Change Photo">
                <HiOutlineCamera />
              </button>
            </div>
            <h2 className="profile-name">{user?.username || 'User'}</h2>
            <p className="profile-email">
              <HiOutlineMail className="inline-icon" />
              {user?.email || 'user@example.com'}
            </p>
            <span className="profile-role-badge">
              <HiOutlineShieldCheck className="badge-icon" />
              {user?.role || 'User'}
            </span>
            
            <div className="profile-status">
              <span className="status-indicator active"></span>
              Active Account
            </div>

            <div className="profile-quick-actions">
              <button className="quick-action-btn edit-profile-btn" onClick={() => setShowEditModal(true)}>
                <HiOutlinePencil />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="profile-content">
          {/* Account Information Card */}
          <div className="profile-card">
            <div className="card-header">
              <div className="card-header-icon">
                <HiOutlineUser />
              </div>
              <div>
                <h3 className="card-title">Account Information</h3>
                <p className="card-subtitle">Your personal account details</p>
              </div>
            </div>
            
            <div className="profile-info-grid">
              <div className="info-item">
                <div className="info-icon">
                  <HiOutlineIdentification />
                </div>
                <div className="info-content">
                  <span className="info-label">User ID</span>
                  <span className="info-value">{user?.id || '1'}</span>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <HiOutlineUser />
                </div>
                <div className="info-content">
                  <span className="info-label">Username</span>
                  <span className="info-value">{user?.username || 'user'}</span>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <HiOutlineMail />
                </div>
                <div className="info-content">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{user?.email || 'user@example.com'}</span>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <HiOutlineShieldCheck />
                </div>
                <div className="info-content">
                  <span className="info-label">Role</span>
                  <span className="info-value">{user?.role || 'User'}</span>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <HiOutlineCheckCircle />
                </div>
                <div className="info-content">
                  <span className="info-label">Account Status</span>
                  <span className="info-value status-active">
                    <span className="status-dot"></span>
                    Active
                  </span>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <HiOutlineCalendar />
                </div>
                <div className="info-content">
                  <span className="info-label">Member Since</span>
                  <span className="info-value">January 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="profile-card">
            <div className="card-header">
              <div className="card-header-icon security">
                <HiOutlineLockClosed />
              </div>
              <div>
                <h3 className="card-title">Security & Privacy</h3>
                <p className="card-subtitle">Manage your security settings</p>
              </div>
            </div>

            <div className="security-items">
              <div className="security-item">
                <div className="security-item-left">
                  <div className="security-icon">
                    <HiOutlineDeviceMobile />
                  </div>
                  <div className="security-details">
                    <span className="security-label">Two-Factor Authentication</span>
                    <span className="security-desc">Add an extra layer of security to your account</span>
                  </div>
                </div>
                <div className="security-item-right">
                  <span className="security-status disabled">
                    <HiOutlineExclamationCircle />
                    Disabled
                  </span>
                  <button className="btn-enable">Enable</button>
                </div>
              </div>

              <div className="security-item">
                <div className="security-item-left">
                  <div className="security-icon">
                    <HiOutlineKey />
                  </div>
                  <div className="security-details">
                    <span className="security-label">Password</span>
                    <span className="security-desc">Last changed 3 months ago</span>
                  </div>
                </div>
                <div className="security-item-right">
                  <button className="btn-action">Change</button>
                </div>
              </div>

              <div className="security-item">
                <div className="security-item-left">
                  <div className="security-icon">
                    <FiActivity />
                  </div>
                  <div className="security-details">
                    <span className="security-label">Active Sessions</span>
                    <span className="security-desc">2 devices currently logged in</span>
                  </div>
                </div>
                <div className="security-item-right">
                  <button className="btn-action">View All</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            {/* Modal Banner */}
            <div className="modal-banner modal-banner-green">
              <div className="modal-banner-avatar">
                {user?.username ? getInitials(user.username) : 'U'}
              </div>
              <div className="modal-banner-info">
                <h2 className="modal-title">{user?.username || 'User'}</h2>
                <p className="modal-subtitle">{user?.email || 'user@example.com'}</p>
              </div>
              <button type="button" className="modal-close modal-close-banner" title="Close modal" onClick={() => setShowEditModal(false)}>
                <HiOutlineXCircle />
              </button>
            </div>

            <form className="modal-form">
              <div className="form-section-label">Personal Information</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-firstname">First Name</label>
                  <div className="input-wrapper">
                    <HiOutlineUser className="input-icon" />
                    <input id="edit-firstname" className="form-input has-icon" type="text" placeholder="Enter first name" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-lastname">Last Name</label>
                  <div className="input-wrapper">
                    <HiOutlineUser className="input-icon" />
                    <input id="edit-lastname" className="form-input has-icon" type="text" placeholder="Enter last name" />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-username">Username</label>
                <div className="input-wrapper">
                  <HiOutlineUserCircle className="input-icon" />
                  <input id="edit-username" className="form-input has-icon" type="text" defaultValue={user?.username || ''} placeholder="Enter username" />
                </div>
              </div>

              <div className="form-section-label">Contact Details</div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-email">Email Address</label>
                <div className="input-wrapper">
                  <HiOutlineMail className="input-icon" />
                  <input id="edit-email" className="form-input has-icon" type="email" defaultValue={user?.email || ''} placeholder="Enter email address" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-phone">Phone Number</label>
                <div className="input-wrapper">
                  <HiOutlinePhone className="input-icon" />
                  <input id="edit-phone" className="form-input has-icon" type="tel" placeholder="Enter phone number" />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={() => setShowEditModal(false)}>
                  <HiOutlineCheckCircle />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfile
