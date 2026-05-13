import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
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
  DialogActions 
} from '@mui/material';
import { Edit } from '@mui/icons-material';

interface Column<T> {
  header: string;
  render: (item: T) => React.ReactNode;
}

interface AdminPageProps<T> {
  title: string;
  endpoint: string;
  columns: Column<T>[];
  renderEditForm: (item: T, onChange: (updated: T) => void) => React.ReactNode;
  getItemId: (item: T) => string;
  initialDataTransform?: (data: any) => T[];
  saveDataTransform?: (items: T[]) => any;
}

export function AdminPage<T>({
  title,
  endpoint,
  columns,
  renderEditForm,
  getItemId,
  initialDataTransform = (data) => data,
  saveDataTransform = (items) => items,
}: AdminPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/.netlify/functions/${endpoint}`)
      .then(res => res.json())
      .then(data => {
        setItems(initialDataTransform(data));
        setLoading(false);
      });
  }, [endpoint, initialDataTransform]);

  const handleSaveItem = () => {
    if (!editingItem) return;
    setItems(prev => prev.map(item => getItemId(item) === getItemId(editingItem) ? editingItem : item));
    setEditingItem(null);
  };

  const handleSaveAll = async () => {
    const res = await fetch(`/.netlify/functions/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveDataTransform(items)),
    });
    if (res.ok) {
      alert(`${title} updated and committed successfully!`);
    } else {
      alert(`Failed to update ${title}.`);
    }
  };

  if (loading) return <Container sx={{ mt: 4 }}><Typography>Loading...</Typography></Container>;

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">{title}</Typography>
        <Button variant="contained" color="primary" onClick={handleSaveAll}>Save All Changes</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col, idx) => (
                <TableCell key={idx}>{col.header}</TableCell>
              ))}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={getItemId(item) || idx}>
                {columns.map((col, colIdx) => (
                  <TableCell key={colIdx}>{col.render(item)}</TableCell>
                ))}
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
        <DialogTitle>Edit: {getItemId(editingItem || {} as T)}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {editingItem && renderEditForm(editingItem, (updated) => setEditingItem(updated))}
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
