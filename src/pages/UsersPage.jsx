import {
  Box, Paper, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead,
  TableRow, Chip, Avatar
} from '@mui/material'
import Navbar from '../components/Navbar'

const users = [
  { id: 1, name: 'Nadeesha Kavindi', email: 'nadeeshkavindi@gmail.com', role: 'Collaborator', status: 'Active' },
  { id: 2, name: 'John Smith', email: 'john@gmail.com', role: 'Project Manager', status: 'Active' },
  { id: 3, name: 'Sara Lee', email: 'sara@gmail.com', role: 'Collaborator', status: 'Active' },
  { id: 4, name: 'Mike Brown', email: 'mike@gmail.com', role: 'Administrator', status: 'Active' },
  { id: 5, name: 'Lisa Wong', email: 'lisa@gmail.com', role: 'Collaborator', status: 'Inactive' },
]

const roleColors = {
  Administrator: 'error',
  'Project Manager': 'warning',
  Collaborator: 'primary'
}

function UsersPage() {
  return (
    <Box sx={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Navbar />

      <Box sx={{ p: 4 }}>
        <Typography variant="h4" sx={{
          mb: 4, fontWeight: 'bold', color: '#1976d2'
        }}>
          User Management
        </Typography>

        <TableContainer component={Paper} elevation={3}
          sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1976d2' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>User</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ backgroundColor: '#1976d2', width: 36, height: 36 }}>
                        {user.name.charAt(0)}
                      </Avatar>
                      <Typography fontWeight="bold">{user.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={roleColors[user.role]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      color={user.status === 'Active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  )
}

export default UsersPage