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
import { AdminPageProps } from './types';
import { FormField } from './FormField';

export function AdminPage<T>({
  title,
  endpoint,
  columns,
  fields,
  getItemId,
  initialData,
  initialDataTransform = (data) => data,
  initialGlobalsTransform,
  saveDataTransform = (items, globals) => items,
  globalFields,
}: AdminPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [globals, setGlobals] = useState<any>({});
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
      setItems(initialDataTransform(initialData));
      if (initialGlobalsTransform) {
        setGlobals(initialGlobalsTransform(initialData));
      }
      setLoading(false);
    } else {
      fetch(`/.netlify/functions/${endpoint}`)
        .then(res => res.json())
        .then(data => {
          setItems(initialDataTransform(data));
          if (initialGlobalsTransform) {
            setGlobals(initialGlobalsTransform(data));
          }
          setLoading(false);
        });
    }
  }, [endpoint, initialData, initialDataTransform, initialGlobalsTransform]);

  const handleSaveItem = () => {
    if (!editingItem) return;
    setItems(prev => prev.map(item => getItemId(item) === getItemId(editingItem) ? editingItem : item));
    setEditingItem(null);
  };

  const handleSaveAll = async () => {
    const itemsToSave = editingItem
      ? items.map(item => getItemId(item) === getItemId(editingItem) ? editingItem : item)
      : items;
    const res = await fetch(`/.netlify/functions/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveDataTransform(itemsToSave, globals)),
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

      {globalFields && globalFields.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {globalFields.map(field => (
              <FormField 
                key={field.name} 
                field={field as any} 
                item={globals} 
                onChange={(updated) => setGlobals(updated)} 
              />
            ))}
          </Box>
        </Paper>
      )}

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
            {editingItem && fields.map(field => (
              <FormField 
                key={String(field.name)} 
                field={field} 
                item={editingItem} 
                onChange={(updated) => setEditingItem(updated)} 
              />
            ))}
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
