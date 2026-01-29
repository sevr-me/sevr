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
  activities,
  usersOverTime,
  usersByCountry,
  loading,
  onRefresh,
  onConnect,
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
    { id: 'activity', label: 'Activity' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Admin Dashboard</DialogTitle>
        </DialogHeader>

        {/* Tab navigation */}
        <div className="flex gap-1 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
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
              loading={loading}
            />
          )}
          {activeTab === 'users' && (
            <UsersTab users={users} loading={loading} />
          )}
          {activeTab === 'activity' && (
            <ActivityTab activities={activities} />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function OverviewTab({ stats, usersOverTime, usersByCountry, loading }) {
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-6 p-1">
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
          <WorldMap data={usersByCountry} />
        </CardContent>
      </Card>
    </div>
  )
}

function UsersTab({ users, loading }) {
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>
  }

  if (users.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No users found</div>
  }

  return (
    <div className="space-y-2 p-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 font-medium">Email</th>
            <th className="text-left py-2 font-medium">Joined</th>
            <th className="text-right py-2 font-medium">Services</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b">
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <span className="truncate max-w-[200px]">{user.email}</span>
                  {user.isAdmin && (
                    <Badge variant="secondary" className="text-xs">Admin</Badge>
                  )}
                </div>
              </td>
              <td className="py-2 text-muted-foreground">
                {formatDate(user.createdAt)}
              </td>
              <td className="py-2 text-right">{user.serviceCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
