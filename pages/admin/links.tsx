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
  Checkbox
} from '@mui/material';
import { Edit, Save } from '@mui/icons-material';

interface LinkItem {
  id: string;
  href: string;
  title: string;
  description: string;
  header: boolean;
  hide?: boolean;
}

export default function LinksAdmin() {
  const [items, setItems] = useState<LinkItem[]>([]);
  const [editingItem, setEditingItem] = useState<LinkItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/.netlify/functions/admin-links')
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      });
  }, []);

  const handleSaveItem = () => {
    if (!editingItem) return;
    const newItems = Array.isArray(items) ? items.map(item => item.id === editingItem.id ? editingItem : item) : [];
    setItems(newItems);
    setEditingItem(null);
  };

  const handleSaveAll = async () => {
    const res = await fetch('/.netlify/functions/admin-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    });
    if (res.ok) {
      alert('Links updated and committed successfully!');
    } else {
      alert('Failed to update links.');
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Links Admin</Typography>
        <Button variant="contained" color="primary" onClick={handleSaveAll}>Save All Changes</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Hide</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(items) && items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.hide ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => setEditingItem(item)}>
                    <Edit />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editingItem} onClose={() => setEditingItem(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Link: {editingItem?.id}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              label="Title" 
              fullWidth 
              value={editingItem?.title || ''} 
              onChange={e => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)} 
            />
            <TextField 
              label="Description" 
              fullWidth 
              value={editingItem?.description || ''} 
              onChange={e => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)} 
            />
            <TextField 
              label="Href" 
              fullWidth 
              value={editingItem?.href || ''} 
              onChange={e => setEditingItem(prev => prev ? { ...prev, href: e.target.value } : null)} 
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={editingItem?.header || false} 
                  onChange={e => setEditingItem(prev => prev ? { ...prev, header: e.target.checked } : null)} 
                />
              }
              label="Is Header"
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={editingItem?.hide || false} 
                  onChange={e => setEditingItem(prev => prev ? { ...prev, hide: e.target.checked } : null)} 
                />
              }
              label="Hide Link"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingItem(null)}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained">Save to List</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
