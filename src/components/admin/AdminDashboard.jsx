import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UsersChart } from './UsersChart'
import { WorldMap } from './WorldMap'

export function AdminDashboard({
  open,
  onOpenChange,
  stats,
  users,
  guides,
  queries,
  blacklist,
  activities,
  usersOverTime,
  usersByCountry,
  onlineUsers,
  loading,
  onRefresh,
  onConnect,
  onDeleteGuide,
  onUpdateGuide,
  onDeleteUser,
  onAddToBlacklist,
  onRemoveFromBlacklist,
  onDeleteQuery,
  onApproveQuery,
  currentUserEmail,
}) {
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (open) {
      onRefresh()
      onConnect()
    }
  }, [open, onRefresh, onConnect])

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'guides', label: 'Guides' },
    { id: 'queries', label: 'Queries' },
    { id: 'blacklist', label: 'Blacklist' },
    { id: 'activity', label: 'Activity' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Admin Dashboard</DialogTitle>
        </DialogHeader>

        {/* Tab navigation */}
        <div className="flex gap-1 border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ScrollArea className="h-[60vh]">
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              usersOverTime={usersOverTime}
              usersByCountry={usersByCountry}
              onlineUsers={onlineUsers}
              loading={loading}
              onRefresh={onRefresh}
            />
          )}
          {activeTab === 'users' && (
            <UsersTab
              users={users}
              loading={loading}
              onDeleteUser={onDeleteUser}
              onAddToBlacklist={onAddToBlacklist}
              currentUserEmail={currentUserEmail}
            />
          )}
          {activeTab === 'guides' && (
            <GuidesTab
              guides={guides}
              loading={loading}
              onDeleteGuide={onDeleteGuide}
              onUpdateGuide={onUpdateGuide}
            />
          )}
          {activeTab === 'queries' && (
            <QueriesTab
              queries={queries}
              loading={loading}
              onDeleteQuery={onDeleteQuery}
              onApproveQuery={onApproveQuery}
            />
          )}
          {activeTab === 'blacklist' && (
            <BlacklistTab
              blacklist={blacklist}
              loading={loading}
              onAddToBlacklist={onAddToBlacklist}
              onRemoveFromBlacklist={onRemoveFromBlacklist}
            />
          )}
          {activeTab === 'activity' && (
            <ActivityTab activities={activities} />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function OverviewTab({ stats, usersOverTime, usersByCountry, onlineUsers, loading, onRefresh }) {
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-6 p-1">
      {/* Online users indicator */}
      {onlineUsers && onlineUsers.length > 0 && (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">
                {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
              </span>
              <span className="text-xs text-muted-foreground">
                ({onlineUsers.slice(0, 3).join(', ')}{onlineUsers.length > 3 ? `, +${onlineUsers.length - 3} more` : ''})
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.userCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Community Guides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.guideCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.todayVisitors ?? 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.todayViews ?? 0} page views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              All-Time Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalVisitors ?? 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.totalViews ?? 0} page views</p>
          </CardContent>
        </Card>
      </div>

      {/* Users over time chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Users Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UsersChart data={usersOverTime} />
        </CardContent>
      </Card>

      {/* Geographic distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Geographic Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WorldMap data={usersByCountry} onRefresh={onRefresh} />
        </CardContent>
      </Card>
    </div>
  )
}

function UsersTab({ users, loading, onDeleteUser, onAddToBlacklist, currentUserEmail }) {
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  if (users.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No users found</div>
  }

  const handleDelete = async (user) => {
    setActionLoading(true)
    await onDeleteUser(user.id)
    setActionLoading(false)
    setConfirmDelete(null)
  }

  const handleDeleteAndBlacklist = async (user) => {
    setActionLoading(true)
    await onAddToBlacklist(user.email, 'Deleted by admin')
    await onDeleteUser(user.id)
    setActionLoading(false)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-2 p-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 font-medium">Email</th>
            <th className="text-left py-2 font-medium">Joined</th>
            <th className="text-right py-2 font-medium">Services</th>
            <th className="text-right py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b">
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <span className="truncate max-w-[180px]">{user.email}</span>
                  {user.isAdmin && (
                    <Badge variant="secondary" className="text-xs">Admin</Badge>
                  )}
                </div>
              </td>
              <td className="py-2 text-muted-foreground">
                {formatDate(user.createdAt)}
              </td>
              <td className="py-2 text-right">{user.serviceCount}</td>
              <td className="py-2 text-right">
                {user.email !== currentUserEmail && !user.isAdmin && (
                  <button
                    onClick={() => setConfirmDelete(user)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md mx-4">
            <h3 className="font-semibold mb-2">Delete User</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete <strong>{confirmDelete.email}</strong>?
              This will permanently remove their account and all data.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm border rounded hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => handleDeleteAndBlacklist(confirmDelete)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
              >
                {actionLoading ? 'Deleting...' : 'Delete & Blacklist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GuidesTab({ guides, loading, onDeleteGuide, onUpdateGuide }) {
  const [editGuide, setEditGuide] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editNoChange, setEditNoChange] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  if (guides.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No guides found</div>
  }

  const handleEdit = (guide) => {
    setEditGuide(guide)
    setEditContent(guide.content || '')
    setEditUrl(guide.settingsUrl || '')
    setEditNoChange(guide.noChangePossible || false)
  }

  const handleSave = async () => {
    setActionLoading(true)
    await onUpdateGuide(editGuide.domain, editContent, editUrl, editNoChange)
    setActionLoading(false)
    setEditGuide(null)
  }

  const handleDelete = async () => {
    setActionLoading(true)
    await onDeleteGuide(confirmDelete.domain)
    setActionLoading(false)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-2 p-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 font-medium">Domain</th>
            <th className="text-left py-2 font-medium">Last Updated</th>
            <th className="text-left py-2 font-medium">By</th>
            <th className="text-right py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {guides.map((guide) => (
            <tr key={guide.domain} className="border-b">
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">{guide.domain}</span>
                  {guide.noChangePossible && (
                    <Badge className="text-xs h-5 px-1.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-0">
                      No change
                    </Badge>
                  )}
                </div>
              </td>
              <td className="py-2 text-muted-foreground">
                {formatDate(guide.updatedAt)}
              </td>
              <td className="py-2 text-muted-foreground truncate max-w-[120px]">
                {guide.updatedBy || 'Unknown'}
              </td>
              <td className="py-2 text-right space-x-2">
                <button
                  onClick={() => handleEdit(guide)}
                  className="text-xs text-primary hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(guide)}
                  className="text-xs text-destructive hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit dialog */}
      {editGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="font-semibold mb-4">Edit Guide: {editGuide.domain}</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="adminNoChange"
                  checked={editNoChange}
                  onChange={(e) => setEditNoChange(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="adminNoChange" className="text-sm font-medium cursor-pointer">
                  No known way to change email address
                </label>
              </div>
              {!editNoChange && (
                <div>
                  <label className="text-sm font-medium">Settings URL</label>
                  <input
                    type="text"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="https://example.com/settings"
                    className="w-full mt-1 px-3 py-2 border rounded text-sm"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">
                  {editNoChange ? 'Notes (optional)' : 'Guide Content'}
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={editNoChange ? 4 : 8}
                  className="w-full mt-1 px-3 py-2 border rounded text-sm font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setEditGuide(null)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm border rounded hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                {actionLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md mx-4">
            <h3 className="font-semibold mb-2">Delete Guide</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete the guide for <strong>{confirmDelete.domain}</strong>?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm border rounded hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BlacklistTab({ blacklist, loading, onAddToBlacklist, onRemoveFromBlacklist }) {
  const [newEmail, setNewEmail] = useState('')
  const [newReason, setNewReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newEmail.trim()) return
    setActionLoading(true)
    await onAddToBlacklist(newEmail.trim(), newReason.trim() || null)
    setNewEmail('')
    setNewReason('')
    setActionLoading(false)
  }

  const handleRemove = async (email) => {
    setActionLoading(true)
    await onRemoveFromBlacklist(email)
    setActionLoading(false)
  }

  return (
    <div className="space-y-4 p-1">
      {/* Add to blacklist form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="email@example.com"
          className="flex-1 px-3 py-2 border rounded text-sm"
          required
        />
        <input
          type="text"
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          placeholder="Reason (optional)"
          className="flex-1 px-3 py-2 border rounded text-sm"
        />
        <button
          type="submit"
          disabled={actionLoading}
          className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50"
        >
          {actionLoading ? 'Adding...' : 'Add'}
        </button>
      </form>

      {blacklist.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No blacklisted emails</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-2 font-medium">Email</th>
              <th className="text-left py-2 font-medium">Reason</th>
              <th className="text-left py-2 font-medium">Added</th>
              <th className="text-right py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blacklist.map((item) => (
              <tr key={item.email} className="border-b">
                <td className="py-2">{item.email}</td>
                <td className="py-2 text-muted-foreground truncate max-w-[150px]">
                  {item.reason || '-'}
                </td>
                <td className="py-2 text-muted-foreground">
                  {formatDate(item.createdAt)}
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => handleRemove(item.email)}
                    disabled={actionLoading}
                    className="text-xs text-destructive hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function QueriesTab({ queries, loading, onDeleteQuery, onApproveQuery }) {
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  if (queries.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No search queries found</div>
  }

  const handleDelete = async () => {
    setActionLoading(true)
    await onDeleteQuery(confirmDelete.id)
    setActionLoading(false)
    setConfirmDelete(null)
  }

  const handleApprove = async (id) => {
    setActionLoading(true)
    await onApproveQuery(id)
    setActionLoading(false)
  }

  const pendingQueries = queries.filter(q => !q.approved)
  const approvedQueries = queries.filter(q => q.approved)

  return (
    <div className="space-y-4 p-1">
      {pendingQueries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-amber-500">Pending Approval ({pendingQueries.length})</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 font-medium">Query</th>
                <th className="text-left py-2 font-medium">Submitted By</th>
                <th className="text-right py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingQueries.map((query) => (
                <tr key={query.id} className="border-b bg-amber-500/5">
                  <td className="py-2">
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">{query.query}</code>
                  </td>
                  <td className="py-2 text-muted-foreground truncate max-w-[120px]">
                    {query.addedBy || 'Unknown'}
                  </td>
                  <td className="py-2 text-right space-x-2">
                    <button
                      onClick={() => handleApprove(query.id)}
                      disabled={actionLoading}
                      className="text-xs text-green-500 hover:underline"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setConfirmDelete(query)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Approved Queries ({approvedQueries.length})</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-2 font-medium">Query</th>
              <th className="text-right py-2 font-medium">Hits</th>
              <th className="text-left py-2 font-medium">Added By</th>
              <th className="text-right py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvedQueries.map((query) => (
              <tr key={query.id} className="border-b">
                <td className="py-2">
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">{query.query}</code>
                </td>
                <td className="py-2 text-right font-mono text-muted-foreground">
                  {query.hitCount?.toLocaleString() || 0}
                </td>
                <td className="py-2 text-muted-foreground truncate max-w-[120px]">
                  {query.addedBy || 'System'}
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => setConfirmDelete(query)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md mx-4">
            <h3 className="font-semibold mb-2">{confirmDelete.approved ? 'Delete' : 'Reject'} Search Query</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to {confirmDelete.approved ? 'delete' : 'reject'} this query?
              <br />
              <code className="bg-muted px-1 py-0.5 rounded mt-2 block">{confirmDelete.query}</code>
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm border rounded hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
              >
                {actionLoading ? 'Deleting...' : confirmDelete.approved ? 'Delete' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActivityTab({ activities }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No activity yet</p>
        <p className="text-sm mt-2">Real-time events will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-1">
      {activities.map((activity, index) => (
        <div
          key={`${activity.timestamp}-${index}`}
          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
        >
          <div className="flex-shrink-0 mt-0.5">
            {activity.type === 'signup' ? (
              <div className="w-2 h-2 rounded-full bg-green-500" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              {activity.type === 'signup' ? (
                <>
                  <span className="font-medium">{activity.email}</span>
                  {' signed up'}
                </>
              ) : activity.type === 'guide_edit' ? (
                <>
                  <span className="font-medium">{activity.email}</span>
                  {' edited guide for '}
                  <span className="font-medium">{activity.domain}</span>
                </>
              ) : (
                <span>{activity.type}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTime(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}
