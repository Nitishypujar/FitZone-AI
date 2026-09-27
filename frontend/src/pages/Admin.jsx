import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

const statusOptions = ['active', 'trial', 'paused', 'expired', 'cancelled']
const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })

function Admin() {
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  const [membershipDraft, setMembershipDraft] = useState(null)
  const [savingMembership, setSavingMembership] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [training, setTraining] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const overviewQuery = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get('/api/admin/overview'),
    refetchInterval: 60_000,
  })

  const selectedMemberQuery = useQuery({
    queryKey: ['admin-member', selectedMemberId],
    queryFn: () => api.get(`/api/admin/members/${selectedMemberId}`),
    enabled: Boolean(selectedMemberId),
  })

  const auditQuery = useQuery({
    queryKey: ['admin-audit'],
    queryFn: () => api.get('/api/admin/audit?limit=40'),
    refetchInterval: 60_000,
  })

  const modelQuery = useQuery({
    queryKey: ['admin-nutrition-model'],
    queryFn: () => api.get('/api/ml/nutrition-model'),
    refetchInterval: 60_000,
  })

  const members = overviewQuery.data?.members || []
  const stats = overviewQuery.data?.stats || {}
  const selectedMember = selectedMemberQuery.data || null
  const audit = auditQuery.data?.audit || []
  const model = modelQuery.data || {}

  const aggregate = useMemo(() => {
    const totalMeals = members.reduce((sum, member) => sum + Number(member.meals_logged || 0), 0)
    const totalWorkouts = members.reduce((sum, member) => sum + Number(member.workouts_completed || 0), 0)
    const totalMinutes = members.reduce((sum, member) => sum + Number(member.active_minutes || 0), 0)
    const goalCounts = members.reduce((acc, member) => {
      const goal = member.primary_goal || 'Unspecified'
      acc[goal] = (acc[goal] || 0) + 1
      return acc
    }, {})
    return { totalMeals, totalWorkouts, totalMinutes, topGoal: Object.entries(goalCounts).sort((a, b) => b[1] - a[1])[0] || null }
  }, [members])

  function openMember(member) {
    setSelectedMemberId(member.id)
    setMembershipDraft(member.membership || { membership_plan: '', status: 'active', start_date: '', end_date: '' })
    setNotice('')
    setError('')
  }

  async function saveMembership() {
    if (!selectedMemberId || !membershipDraft) return
    try {
      setSavingMembership(true)
      setError('')
      setNotice('')
      await api.put(`/api/admin/members/${selectedMemberId}/membership`, membershipDraft)
      setNotice('Membership updated and audited.')
      await overviewQuery.refetch()
      await selectedMemberQuery.refetch()
      await auditQuery.refetch()
    } catch (err) {
      setError(err.message || 'Membership update failed.')
    } finally {
      setSavingMembership(false)
    }
  }

  async function exportMembers() {
    try {
      setExporting(true)
      setError('')
      const response = await fetch(`${apiBase()}/api/admin/export?type=members`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('fitzone_access_token') || ''}` },
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || 'Export failed.')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'fitzone-members.csv'
      link.click()
      URL.revokeObjectURL(url)
      await auditQuery.refetch()
    } catch (err) {
      setError(err.message || 'Export failed.')
    } finally {
      setExporting(false)
    }
  }

  async function trainNutritionModel() {
    try {
      setTraining(true)
      setError('')
      setNotice('')
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      const response = await api.post('/api/ml/train-nutrition', { timezone: timeZone })
      setNotice(`Nutrition behavior model trained from ${response.samples} real historical examples.`)
      await modelQuery.refetch()
      await auditQuery.refetch()
    } catch (err) {
      setError(err.message || 'Nutrition model training could not run.')
    } finally {
      setTraining(false)
    }
  }

  if (overviewQuery.isLoading) {
    return <main className="admin-page"><section className="admin-loading"><p className="eyebrow">OWNER CONSOLE</p><h1>Loading the <span>member state.</span></h1><p>FitZone is checking your administrator access and loading live member data.</p></section></main>
  }

  if (overviewQuery.isError) {
    return <main className="admin-page"><section className="admin-loading"><p className="eyebrow">OWNER CONSOLE</p><h1>Admin access is <span>unavailable.</span></h1><p>{overviewQuery.error.message}</p></section></main>
  }

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="eyebrow">FITZONE AI OWNER CONSOLE</p>
          <h1>Run the gym from <span>one secure view.</span></h1>
          <p>Membership, member activity, nutrition signals, adaptive-system analytics and audit history are surfaced through protected backend endpoints.</p>
        </div>
        <div className="admin-header-actions">
          <button className="secondary-button" onClick={exportMembers} disabled={exporting}>{exporting ? 'Preparing…' : 'Export members'}</button>
          <button className="primary-button" onClick={() => { overviewQuery.refetch(); auditQuery.refetch(); modelQuery.refetch() }}>Refresh</button>
        </div>
      </section>

      {(notice || error) && <div className={`admin-banner ${error ? 'error' : ''}`} role="status"><strong>{error ? 'Action failed' : 'Updated'}</strong><span>{error || notice}</span></div>}

      <section className="admin-stat-grid">
        <article><span>TOTAL MEMBERS</span><strong>{numberFormat.format(stats.total_members || 0)}</strong><small>Profiles in FitZone</small></article>
        <article><span>ACTIVE MEMBERS</span><strong>{stats.active_members == null ? '—' : numberFormat.format(stats.active_members)}</strong><small>Current membership state</small></article>
        <article><span>WORKOUTS COMPLETED</span><strong>{numberFormat.format(stats.completed_workouts || 0)}</strong><small>{numberFormat.format(aggregate.totalMinutes)} tracked minutes</small></article>
        <article><span>NUTRITION ENTRIES</span><strong>{numberFormat.format(stats.nutrition_entries || 0)}</strong><small>{numberFormat.format(aggregate.totalMeals)} real meal records</small></article>
      </section>

      <section className="admin-main-grid">
        <article className="admin-card admin-members-card">
          <div className="admin-card-heading"><div><p className="eyebrow">MEMBERS</p><h2>Gym member directory</h2></div><span className="admin-pill">LIVE DATA</span></div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Member</th><th>Goal</th><th>Workouts</th><th>Nutrition</th><th>Membership</th><th /></tr></thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td><strong>{member.full_name || 'Unnamed member'}</strong><small>{member.id.slice(0, 8)}…</small></td>
                    <td>{formatGoal(member.primary_goal)}</td>
                    <td>{member.workouts_completed}</td>
                    <td>{member.meals_logged}</td>
                    <td><span className={`membership-status ${member.membership?.status || 'unassigned'}`}>{member.membership?.status || 'unassigned'}</span></td>
                    <td><button className="text-button" onClick={() => openMember(member)}>Open</button></td>
                  </tr>
                ))}
                {members.length === 0 && <tr><td colSpan="6"><div className="admin-empty">No member profiles are available yet.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </article>

        <article className="admin-card admin-insight-card">
          <p className="eyebrow">ORGANIZATION SIGNAL</p>
          <h2>Current member pattern</h2>
          {aggregate.topGoal ? <><strong className="admin-big-insight">{formatGoal(aggregate.topGoal[0])}</strong><p>{aggregate.topGoal[1]} member{aggregate.topGoal[1] > 1 ? 's' : ''} currently show this as their primary goal.</p></> : <p>No goal distribution is available yet.</p>}
          <div className="admin-insight-metrics"><div><span>COMPLETED WORKOUTS</span><strong>{aggregate.totalWorkouts}</strong></div><div><span>LOGGED MEALS</span><strong>{aggregate.totalMeals}</strong></div></div>
        </article>
      </section>

      <section className="admin-main-grid">
        <article className="admin-card admin-ml-card">
          <div className="admin-card-heading"><div><p className="eyebrow">NUTRITION ML</p><h2>Behavioral model</h2></div><span className="admin-pill">{model?.model?.trained ? 'TRAINED' : 'COLD START'}</span></div>
          <div className="admin-model-state"><div><span>VERSION</span><strong>{model?.model?.trained_at ? new Date(model.model.trained_at).toLocaleDateString() : '—'}</strong></div><div><span>TRAINED EXAMPLES</span><strong>{model?.model?.sample_count || 0}</strong></div><div><span>MODEL</span><strong>{model?.model?.type || 'logistic_regression'}</strong></div></div>
          <p>{model?.model?.trained_at ? `Last trained ${new Date(model.model.trained_at).toLocaleString()}.` : 'The nutrition adherence model has not been trained on member history yet.'}</p>
          <button className="primary-button" onClick={trainNutritionModel} disabled={training}>{training ? 'Training from real history…' : 'Train from member history'}</button>
        </article>

        <article className="admin-card admin-audit-card">
          <div className="admin-card-heading"><div><p className="eyebrow">AUDIT TRAIL</p><h2>Recent admin actions</h2></div><span className="admin-pill">PROTECTED</span></div>
          <div className="admin-audit-list">
            {audit.map((item) => <div key={item.id}><span>{new Date(item.created_at).toLocaleString()}</span><strong>{item.action}</strong><small>{item.target_user_id ? `Member ${item.target_user_id.slice(0, 8)}…` : 'System action'}</small></div>)}
            {audit.length === 0 && <p className="admin-empty">No audit entries are available yet.</p>}
          </div>
        </article>
      </section>

      {selectedMemberId && (
        <section className="admin-card admin-detail-card">
          <div className="admin-card-heading"><div><p className="eyebrow">MEMBER DETAIL</p><h2>{selectedMember?.profile?.full_name || 'Member'}</h2><p>{selectedMember?.profile?.primary_goal ? `Goal: ${formatGoal(selectedMember.profile.primary_goal)}` : 'Detailed member view'}</p></div><button className="secondary-button" onClick={() => setSelectedMemberId(null)}>Close</button></div>
          {selectedMemberQuery.isLoading ? <p className="admin-muted">Loading member detail…</p> : selectedMemberQuery.isError ? <p className="admin-muted">{selectedMemberQuery.error.message}</p> : (
            <>
              <div className="admin-detail-stats"><div><span>WORKOUTS</span><strong>{selectedMember.workouts?.filter((item) => item.completed).length || 0}</strong></div><div><span>MEALS</span><strong>{selectedMember.nutrition?.length || 0}</strong></div><div><span>PROGRESS RECORDS</span><strong>{selectedMember.progress?.length || 0}</strong></div></div>
              <div className="admin-membership-editor"><div><p className="eyebrow">MEMBERSHIP</p><h3>Membership status</h3></div><div className="admin-membership-fields"><input placeholder="Plan name" value={membershipDraft?.membership_plan || ''} onChange={(e) => setMembershipDraft((d) => ({ ...d, membership_plan: e.target.value }))} /><select value={membershipDraft?.status || 'active'} onChange={(e) => setMembershipDraft((d) => ({ ...d, status: e.target.value }))}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select><input type="date" value={membershipDraft?.start_date || ''} onChange={(e) => setMembershipDraft((d) => ({ ...d, start_date: e.target.value }))} /><input type="date" value={membershipDraft?.end_date || ''} onChange={(e) => setMembershipDraft((d) => ({ ...d, end_date: e.target.value }))} /><button className="primary-button" onClick={saveMembership} disabled={savingMembership}>{savingMembership ? 'Saving…' : 'Save membership'}</button></div></div>
              <div className="admin-recent-data"><div><p className="eyebrow">RECENT WORKOUTS</p>{(selectedMember.workouts || []).slice(0, 5).map((workout) => <div className="admin-mini-row" key={workout.id}><strong>{workout.workout_name || 'Workout'}</strong><span>{workout.completed ? 'Completed' : 'Planned'} · {workout.completed_at ? new Date(workout.completed_at).toLocaleDateString() : '—'}</span></div>)}</div><div><p className="eyebrow">RECENT NUTRITION</p>{(selectedMember.nutrition || []).slice(0, 5).map((meal) => <div className="admin-mini-row" key={meal.id}><strong>{meal.meal_name || 'Meal'}</strong><span>{meal.calories || 0} kcal · {meal.protein_g || 0}g protein</span></div>)}</div></div>
            </>
          )}
        </section>
      )}
    </main>
  )
}

function apiBase() {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
}

function formatGoal(value) {
  if (!value) return 'Unspecified'
  return String(value).replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default Admin
