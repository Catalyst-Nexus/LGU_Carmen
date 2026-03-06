import { useState, useRef } from 'react'
import { useAuthStore } from '@/store'
import { cn } from '@/lib/utils'
import { uploadImage } from '@/services/imageUpload'
import {
  Shield,
  Edit,
  User,
  Mail,
  IdCard,
  Calendar,
  CheckCircle,
  Lock,
  Key,
  Smartphone,
  Activity,
  X,
  Camera,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

const UserProfile = () => {
  const user = useAuthStore((state) => state.user)
  const updateProfilePicture = useAuthStore((state) => state.updateProfilePicture)
  const [showEditModal, setShowEditModal] = useState(false)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [pictureError, setPictureError] = useState<string | null>(null)
  const pictureInputRef = useRef<HTMLInputElement>(null)

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()

  const accountInfo = [
    { icon: IdCard, label: 'User ID', value: user?.id || '1' },
    { icon: User, label: 'Username', value: user?.username || 'user' },
    { icon: Mail, label: 'Email Address', value: user?.email || 'user@example.com' },
    { icon: Shield, label: 'Role', value: user?.role || 'User' },
    { icon: CheckCircle, label: 'Account Status', value: 'Active', isStatus: true },
    { icon: Calendar, label: 'Member Since', value: 'January 2026' },
  ]

  const securityItems = [
    {
      icon: Smartphone,
      label: 'Two-Factor Authentication',
      description: 'Add an extra layer of security to your account',
      status: 'Disabled',
      statusType: 'warning',
      action: 'Enable',
      actionType: 'success',
    },
    {
      icon: Key,
      label: 'Password',
      description: 'Last changed 3 months ago',
      action: 'Change',
      actionType: 'outline',
    },
    {
      icon: Activity,
      label: 'Active Sessions',
      description: '2 devices currently logged in',
      action: 'View All',
      actionType: 'outline',
    },
  ]

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingPicture(true)
    setPictureError(null)

    const userId = user?.id || 'user'
    const result = await uploadImage(file, 'profile_picture', `${userId}-${Date.now()}`)

    if (result.success && result.url) {
      updateProfilePicture(result.url)
    } else {
      setPictureError(result.error || 'Failed to upload profile picture')
    }

    setUploadingPicture(false)
    
    // Reset file input
    if (pictureInputRef.current) {
      pictureInputRef.current.value = ''
    }
  }

  const handleRemoveProfilePicture = () => {
    updateProfilePicture(null)
    setPictureError(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">User Profile</h1>
        <p className="text-sm text-muted mt-1">View and manage your profile information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Left Sidebar - Profile Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 text-center h-fit">
          {/* Avatar */}
          <div className="flex justify-center mb-4 relative group">
            {user?.profilePicture ? (
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                  <img
                    src={user.profilePicture}
                    alt={user.username || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={handleRemoveProfilePicture}
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-danger/90"
                  title="Remove picture"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-3xl font-bold">
                {user?.username ? getInitials(user.username) : 'U'}
              </div>
            )}
            
            {/* Upload Button */}
            <div className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-2">
              <input
                ref={pictureInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
                id="profile-picture-upload"
                disabled={uploadingPicture}
                aria-label="Profile picture upload"
              />
              <label
                htmlFor="profile-picture-upload"
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full',
                  'bg-primary text-white cursor-pointer shadow-lg',
                  'hover:bg-primary-light transition-colors',
                  uploadingPicture && 'opacity-50 cursor-not-allowed'
                )}
                title="Change profile picture"
              >
                <Camera className="w-5 h-5" />
              </label>
            </div>
          </div>

          {pictureError && (
            <div className="mb-3 p-2 rounded-lg text-xs bg-danger/10 text-danger border border-danger/20">
              {pictureError}
            </div>
          )}

          <h2 className="text-xl font-bold text-primary">{user?.username || 'User'}</h2>
          <p className="text-sm text-muted mt-1">{user?.email || 'user@example.com'}</p>

          {/* Role Badge */}
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-success/10 text-success rounded-full text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            {user?.role || 'User'}
          </div>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Active Account
          </div>

          {/* Edit Button */}
          <button
            className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-light transition-colors"
            onClick={() => setShowEditModal(true)}
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        </div>

        {/* Right Content */}
        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                <User className="w-5 h-5" />
                Account Information
              </h3>
              <p className="text-sm text-muted mt-1">Your personal account details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accountInfo.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 p-4 bg-background rounded-xl"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10 text-success">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs text-muted font-medium uppercase tracking-wide">
                        {item.label}
                      </span>
                      {item.isStatus ? (
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-success mt-1">
                          <span className="w-2 h-2 rounded-full bg-success" />
                          {item.value}
                        </span>
                      ) : (
                        <span className="block text-sm font-semibold text-foreground mt-1">
                          {item.value}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Security & Privacy */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Lock className="w-5 h-5" />
                Security & Privacy
              </h3>
              <p className="text-sm text-muted mt-1">Manage your security settings</p>
            </div>

            <div className="space-y-4">
              {securityItems.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-4 bg-background rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-info/10 text-info">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-foreground">
                          {item.label}
                        </span>
                        <span className="block text-xs text-muted mt-0.5">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.status && (
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            item.statusType === 'warning'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-success/10 text-success'
                          )}
                        >
                          {item.status}
                        </span>
                      )}
                      <button
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                          item.actionType === 'success'
                            ? 'bg-success text-white hover:bg-success/90'
                            : 'border border-border text-foreground hover:bg-background'
                        )}
                      >
                        {item.action}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog.Root open={showEditModal} onOpenChange={setShowEditModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl z-50">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <Dialog.Title className="text-lg font-semibold text-primary">
                Edit Profile
              </Dialog.Title>
              <Dialog.Close className="p-2 rounded-lg hover:bg-background transition-colors text-muted">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Personal Information
                </span>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                  defaultValue={user?.username || ''}
                  placeholder="Enter username"
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Contact Details
                </span>
                <div className="space-y-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                      defaultValue={user?.email || ''}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <Dialog.Close className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-background transition-colors">
                Cancel
              </Dialog.Close>
              <button
                className="px-4 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
                onClick={() => setShowEditModal(false)}
              >
                Save Changes
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

export default UserProfile
