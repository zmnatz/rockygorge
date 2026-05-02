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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { Delete, Edit, Save, Add } from '@mui/icons-material';

interface StoreItem {
  name: string;
  title?: string;
  description?: string;
  info?: string;
  defaultAmount?: number;
  hide?: boolean;
  options?: { name: string; value: number | string }[];
  subscriptions?: { name: string; id: string; description?: string; value?: string; options?: { label: string; value: string }[] }[];
  supporters?: string[];
  donation?: boolean;
  details?: string;
}

export default function StoreAdmin() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/.netlify/functions/admin-store')
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      });
  }, []);

  const handleSaveItem = () => {
    if (!editingItem) return;
    const newItems = Array.isArray(items) ? items.map(item => item.name === editingItem.name ? editingItem : item) : [];
    setItems(newItems);
    setEditingItem(null);
  };

  const handleSaveAll = async () => {
    const res = await fetch('/.netlify/functions/admin-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    });
    if (res.ok) {
      alert('Store updated and committed successfully!');
    } else {
      alert('Failed to update store.');
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Store Admin</Typography>
        <Button variant="contained" color="primary" onClick={handleSaveAll}>Save All Changes</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Hide</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(items) && items.map((item) => (
              <TableRow key={item.name}>
                <TableCell>{item.name}</TableCell>
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
        <DialogTitle>Edit Item: {editingItem?.name}</DialogTitle>
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
              label="Info" 
              fullWidth 
              value={editingItem?.info || ''} 
              onChange={e => setEditingItem(prev => prev ? { ...prev, info: e.target.value } : null)} 
            />
            <TextField 
              label="Default Amount" 
              type="number" 
              fullWidth 
              value={editingItem?.defaultAmount || ''} 
              onChange={e => setEditingItem(prev => prev ? { ...prev, defaultAmount: Number(e.target.value) } : null)} 
            />
            <TextField 
              label="Details" 
              multiline 
              rows={4} 
              fullWidth 
              value={editingItem?.details || ''} 
              onChange={e => setEditingItem(prev => prev ? { ...prev, details: e.target.value } : null)} 
            />
            
            <Typography variant="h6">Options</Typography>
            <List>
              {editingItem?.options?.map((opt, idx) => (
                <ListItem key={idx} secondaryAction={
                  <IconButton edge="end" onClick={() => {
                    const newOpts = [...(editingItem?.options || [])];
                    newOpts.splice(idx, 1);
                    setEditingItem(prev => prev ? { ...prev, options: newOpts } : null);
                  }}>
                    <Delete />
                  </IconButton>
                }>
                  <ListItemText 
                    primary={
                      <TextField 
                        size="small" 
                        label="Name" 
                        value={opt.name} 
                        onChange={e => {
                          const newOpts = [...(editingItem?.options || [])];
                          newOpts[idx].name = e.target.value;
                          setEditingItem(prev => prev ? { ...prev, options: newOpts } : null);
                        }}
                      />
                    }
                    secondary={
                      <TextField 
                        size="small" 
                        label="Value" 
                        type="number" 
                        value={opt.value} 
                        onChange={e => {
                          const newOpts = [...(editingItem?.options || [])];
                          newOpts[idx].value = Number(e.target.value);
                          setEditingItem(prev => prev ? { ...prev, options: newOpts } : null);
                        }}
                      />
                    }
                  />
                </ListItem>
              ))}
              <Button startIcon={<Add />} onClick={() => {
                const newOpts = [...(editingItem?.options || []), { name: '', value: 0 }];
                setEditingItem(prev => prev ? { ...prev, options: newOpts } : null);
              }}>Add Option</Button>
            </List>

            <Typography variant="h6">Supporters</Typography>
            <List>
              {editingItem?.supporters?.map((supporter, idx) => (
                <ListItem key={idx} secondaryAction={
                  <IconButton edge="end" onClick={() => {
                    const newSupps = [...(editingItem?.supporters || [])];
                    newSupps.splice(idx, 1);
                    setEditingItem(prev => prev ? { ...prev, supporters: newSupps } : null);
                  }}>
                    <Delete />
                  </IconButton>
                }>
                  <ListItemText 
                    primary={
                      <TextField 
                        size="small" 
                        value={supporter} 
                        onChange={e => {
                          const newSupps = [...(editingItem?.supporters || [])];
                          newSupps[idx] = e.target.value;
                          setEditingItem(prev => prev ? { ...prev, supporters: newSupps } : null);
                        }}
                      />
                    }
                  />
                </ListItem>
              ))}
              <Button startIcon={<Add />} onClick={() => {
                const newSupps = [...(editingItem?.supporters || []), ''];
                setEditingItem(prev => prev ? { ...prev, supporters: newSupps } : null);
              }}>Add Supporter</Button>
            </List>
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
