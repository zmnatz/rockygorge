import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  TextField, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { Edit, Delete, Add, Save } from '@mui/icons-material';

interface FilterItem {
  name: string;
  limit?: number;
  matches?: string;
  notMatches?: string;
  hideSummary?: boolean;
}

interface CalendarData {
  months: number;
  filters: FilterItem[];
}

export default function CalendarAdmin() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [editingFilter, setEditingFilter] = useState<FilterItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/.netlify/functions/admin-calendar')
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      });
  }, []);

  const handleSaveFilter = () => {
    if (!editingFilter || !data) return;
    const newFilters = data.filters.map(f => f.name === editingFilter.name ? editingFilter : f);
    setData({ ...data, filters: newFilters });
    setEditingFilter(null);
  };

  const handleSaveAll = async () => {
    if (!data) return;
    const res = await fetch('/.netlify/functions/admin-calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      alert('Calendar updated and committed successfully!');
    } else {
      alert('Failed to update calendar.');
    }
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (!data) return <Typography>No data found.</Typography>;

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Calendar Admin</Typography>
        <Button variant="contained" color="primary" onClick={handleSaveAll}>Save All Changes</Button>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <TextField 
          label="Months" 
          type="number" 
          value={data.months} 
          onChange={e => setData({ ...data, months: Number(e.target.value) })} 
        />
      </Paper>

      <Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Matches</TableCell>
              <TableCell>Limit</TableCell>
              <TableCell>Hide Summary</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.filters.map((filter, idx) => (
              <TableRow key={idx}>
                <TableCell>{filter.name}</TableCell>
                <TableCell>{filter.matches || filter.notMatches || '-'}</TableCell>
                <TableCell>{filter.limit ?? '-'}</TableCell>
                <TableCell>{filter.hideSummary ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => setEditingFilter(filter)}>
                    <Edit />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editingFilter} onClose={() => setEditingFilter(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Filter: {editingFilter?.name}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              label="Name" 
              fullWidth 
              value={editingFilter?.name || ''} 
              onChange={e => setEditingFilter(prev => prev ? { ...prev, name: e.target.value } : null)} 
            />
            <TextField 
              label="Matches" 
              fullWidth 
              value={editingFilter?.matches || ''} 
              onChange={e => setEditingFilter(prev => prev ? { ...prev, matches: e.target.value } : null)} 
            />
            <TextField 
              label="Not Matches" 
              fullWidth 
              value={editingFilter?.notMatches || ''} 
              onChange={e => setEditingFilter(prev => prev ? { ...prev, notMatches: e.target.value } : null)} 
            />
            <TextField 
              label="Limit" 
              type="number" 
              fullWidth 
              value={editingFilter?.limit ?? ''} 
              onChange={e => setEditingFilter(prev => prev ? { ...prev, limit: Number(e.target.value) } : null)} 
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={editingFilter?.hideSummary || false} 
                  onChange={e => setEditingFilter(prev => prev ? { ...prev, hideSummary: e.target.checked } : null)} 
                />
              }
              label="Hide Summary"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingFilter(null)}>Cancel</Button>
          <Button onClick={handleSaveFilter} variant="contained">Save to List</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
