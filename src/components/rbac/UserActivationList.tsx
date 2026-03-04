import React from 'react'
import { DataTable, IconButton } from '@/components/ui'
import { Check, X } from 'lucide-react'

interface PendingUser {
  id: string
  name: string
  email: string
  requestedAt: string
}

interface UserActivationListProps {
  users: PendingUser[]
  search: string
  onSearchChange: (value: string) => void
  onActivate: (user: PendingUser) => void
  onReject: (user: PendingUser) => void
}

const UserActivationList = ({
  users,
  search,
  onSearchChange,
  onActivate,
  onReject,
}: UserActivationListProps) => {
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  )

  const columns: Array<{ key: keyof PendingUser | 'actions'; header: string; render: (user: PendingUser) => React.ReactNode }> = [
    { key: 'name', header: 'Name', render: (user: PendingUser) => user.name },
    { key: 'email', header: 'Email', render: (user: PendingUser) => user.email },
    { key: 'requestedAt', header: 'Requested At', render: (user: PendingUser) => user.requestedAt },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: PendingUser) => (
        <div className="flex items-center gap-2">
          <IconButton onClick={() => onActivate(user)} title="Activate" variant="success">
            <Check className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={() => onReject(user)} title="Reject" variant="danger">
            <X className="w-4 h-4" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <DataTable
      data={filteredUsers}
      columns={columns}
      keyField="id"
      searchPlaceholder="Search pending users..."
      searchValue={search}
      onSearchChange={onSearchChange}
      emptyMessage="No pending activations"
    />
  )
}

export default UserActivationList
