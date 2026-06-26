import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { Box, Typography, Paper, Avatar, Chip, Divider, Alert, CircularProgress } from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import WorkIcon from '@mui/icons-material/Work'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import LockIcon from '@mui/icons-material/Lock'
import { api } from '../services/api'
import { THEME } from '../theme'

const mapRoleToUI = (role) => {
  if (role === 'ADMIN') return 'Administrator';
  if (role === 'PROJECT_MANAGER') return 'Project Manager';
  if (role === 'COLLABORATOR') return 'Collaborator';
  return role;
};

function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [myTasks, setMyTasks] = useState([])
  const [loading, setLoading] = useState(true)

  // Name edit state
  const [nameValue, setNameValue] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMsg, setNameMsg] = useState(null) // { type, text }

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState(null) // { type, text }

  useEffect(() => {
    async function loadProfileData() {
      try {
        const fetchedProfile = await api.getProfile();
        setProfile(fetchedProfile);
        setNameValue(fetchedProfile.name || '');
        const fetchedTasks = await api.getTasks();
        const filtered = fetchedTasks.filter(t => t.assigned_to === fetchedProfile.id);
        setMyTasks(filtered);
      } catch (err) {
        console.error('Failed to load profile data:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfileData();
  }, [])

  const handleSaveName = async (e) => {
    e.preventDefault()
    if (!nameValue.trim()) { setNameMsg({ type: 'error', text: 'Name cannot be empty.' }); return }
    setNameSaving(true); setNameMsg(null)
    try {
      const updated = await api.updateProfile({ name: nameValue.trim() })
      setProfile(updated.user)
      setNameValue(updated.user.name)
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const u = JSON.parse(userStr)
        u.name = updated.user.name
        localStorage.setItem('user', JSON.stringify(u))
      }
      setNameMsg({ type: 'success', text: 'Name updated successfully!' })
    } catch (err) {
      setNameMsg({ type: 'error', text: err.message || 'Failed to update name.' })
    } finally { setNameSaving(false) }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwMsg({ type: 'error', text: 'Please fill in all password fields.' }); return
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' }); return
    }
    if (newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' }); return
    }
    setPwSaving(true); setPwMsg(null)
    try {
      await api.changePassword(currentPassword, newPassword)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setPwMsg({ type: 'success', text: 'Password changed successfully!' })
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to change password.' })
    } finally { setPwSaving(false) }
  }

  if (loading) {
    return (
      <Layout>
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: THEME.colors.mainBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: THEME.colors.textMain }}>Loading profile...</Typography>
        </Box>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: THEME.colors.mainBg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: THEME.colors.textMain }}>Profile not found. Please log in again.</Typography>
        </Box>
      </Layout>
    );
  }

  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString([], { year: 'numeric', month: 'short' })
    : 'N/A';

  const letter = profile.name ? profile.name[0].toUpperCase() : 'U';

  return (
    <Layout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: THEME.colors.mainBg, minHeight: '100vh' }}>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
            Profile
          </Typography>
          <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mt: 0.5 }}>
            Your personal information
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', flexDirection: { xs: 'column', md: 'row' } }}>

          {/* Left card */}
          <Paper elevation={0} sx={{
            p: 4, borderRadius: 3.5, width: { xs: '100%', md: 280 }, flexShrink: 0,
            backgroundColor: '#ffffff',
            border: '1px solid rgba(27,94,85,0.08)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
          }}>
            <Avatar sx={{
              width: 90, height: 90, fontSize: 36, fontWeight: 'bold', mb: 2,
              background: THEME.colors.sidebarBg, color: 'white'
            }}>{letter}</Avatar>

            <Typography variant="h6" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
              {profile.name}
            </Typography>
            <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mb: 2 }}>
              {mapRoleToUI(profile.role)}
            </Typography>

            <Chip label="Active" size="small" sx={{
              backgroundColor: 'rgba(27,94,85,0.08)',
              color: THEME.colors.sidebarBg, fontWeight: 700,
              border: '1px solid rgba(27,94,85,0.15)', mb: 3
            }} />

            <Divider sx={{ borderColor: 'rgba(27,94,85,0.1)', width: '100%', mb: 3 }} />

            {[
              { icon: <EmailIcon sx={{ fontSize: 16 }} />, text: profile.email },
              { icon: <WorkIcon sx={{ fontSize: 16 }} />, text: mapRoleToUI(profile.role) },
              { icon: <CalendarTodayIcon sx={{ fontSize: 16 }} />, text: `Joined ${joinDate}` },
            ].map((item, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                mb: 1.5, width: '100%'
              }}>
                <Box sx={{ color: THEME.colors.sidebarBg }}>{item.icon}</Box>
                <Typography variant="body2" sx={{ color: THEME.colors.textMain, fontSize: 13 }} noWrap title={item.text}>
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Paper>

          {/* Right side */}
          <Box sx={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Edit Name Card */}
            <Paper elevation={0} sx={{
              p: 4, borderRadius: 3.5,
              backgroundColor: '#ffffff',
              border: '1px solid rgba(27,94,85,0.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: THEME.colors.textMain, mb: 3 }}>
                Edit Profile
              </Typography>

              <Box component="form" onSubmit={handleSaveName}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mb: 1, fontWeight: 500 }}>
                    Full Name
                  </Typography>
                  <Box sx={{
                    display: 'flex', alignItems: 'center',
                    border: '1px solid rgba(27,94,85,0.15)',
                    borderRadius: 2.5, p: 1.5,
                    backgroundColor: 'rgba(27,94,85,0.02)'
                  }}>
                    <input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      style={{
                        border: 'none', outline: 'none', background: 'transparent',
                        width: '100%', fontSize: 15, color: THEME.colors.textMain
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mb: 1, fontWeight: 500 }}>
                    Email Address
                  </Typography>
                  <Box sx={{
                    display: 'flex', alignItems: 'center',
                    border: '1px solid rgba(27,94,85,0.08)',
                    borderRadius: 2.5, p: 1.5,
                    backgroundColor: 'rgba(27,94,85,0.04)'
                  }}>
                    <input
                      value={profile?.email || ''}
                      disabled
                      style={{
                        border: 'none', outline: 'none', background: 'transparent',
                        width: '100%', fontSize: 15, color: THEME.colors.textMuted
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: THEME.colors.textMuted, mt: 0.5, display: 'block' }}>
                    Email address cannot be changed.
                  </Typography>
                </Box>

                {nameMsg && (
                  <Alert severity={nameMsg.type} sx={{ borderRadius: 2.5, mb: 2 }}>{nameMsg.text}</Alert>
                )}

                <button type="submit" disabled={nameSaving} style={{
                  backgroundColor: THEME.colors.sidebarBg,
                  color: '#fff', border: 'none', borderRadius: 20,
                  padding: '10px 24px', fontSize: 14, fontWeight: 'bold',
                  cursor: nameSaving ? 'not-allowed' : 'pointer',
                  opacity: nameSaving ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(27,94,85,0.15)'
                }}>
                  {nameSaving ? 'Saving...' : 'Save Name'}
                </button>
              </Box>
            </Paper>

            {/* Change Password Card */}
            <Paper elevation={0} sx={{
              p: 4, borderRadius: 3.5,
              backgroundColor: '#ffffff',
              border: '1px solid rgba(27,94,85,0.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <LockIcon sx={{ color: THEME.colors.sidebarBg, fontSize: 20 }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>
                  Change Password
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleChangePassword}>
                {[{
                  label: 'Current Password', value: currentPassword,
                  setter: setCurrentPassword, placeholder: 'Enter current password'
                }, {
                  label: 'New Password', value: newPassword,
                  setter: setNewPassword, placeholder: 'At least 6 characters'
                }, {
                  label: 'Confirm New Password', value: confirmPassword,
                  setter: setConfirmPassword, placeholder: 'Re-enter new password'
                }].map((field) => (
                  <Box key={field.label} sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mb: 1, fontWeight: 500 }}>
                      {field.label}
                    </Typography>
                    <Box sx={{
                      display: 'flex', alignItems: 'center',
                      border: '1px solid rgba(27,94,85,0.15)',
                      borderRadius: 2.5, p: 1.5,
                      backgroundColor: 'rgba(27,94,85,0.02)'
                    }}>
                      <input
                        type="password"
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        placeholder={field.placeholder}
                        style={{
                          border: 'none', outline: 'none', background: 'transparent',
                          width: '100%', fontSize: 15, color: THEME.colors.textMain
                        }}
                      />
                    </Box>
                  </Box>
                ))}

                {pwMsg && (
                  <Alert severity={pwMsg.type} sx={{ borderRadius: 2.5, mb: 2 }}>{pwMsg.text}</Alert>
                )}

                <button type="submit" disabled={pwSaving} style={{
                  backgroundColor: '#12131a',
                  color: '#fff', border: 'none', borderRadius: 20,
                  padding: '10px 24px', fontSize: 14, fontWeight: 'bold',
                  cursor: pwSaving ? 'not-allowed' : 'pointer',
                  opacity: pwSaving ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
                }}>
                  {pwSaving ? 'Changing...' : 'Change Password'}
                </button>
              </Box>
            </Paper>

          </Box>
        </Box>
      </Box>
    </Layout>
  )
}

export default ProfilePage
