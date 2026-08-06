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
import { Add, Delete, Edit } from '@mui/icons-material';
import { AdminPageProps } from './types';
import { FormField } from './FormField';
import { get, post } from '@/utils/api';
import { applyItemChange, createDefaultItem, removeItemById, validateItemId } from '@/utils/admin-items';

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
  creatable = true,
  createDefaults = {},
  idFieldName = 'id',
}: AdminPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [globals, setGlobals] = useState<any>({});
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [editingOriginalId, setEditingOriginalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
      setItems(initialDataTransform(initialData));
      if (initialGlobalsTransform) {
        setGlobals(initialGlobalsTransform(initialData));
      }
      setLoading(false);
    } else {
      get<any>(`/.netlify/functions/${endpoint}`).then(data => {
        setItems(initialDataTransform(data));
        if (initialGlobalsTransform) {
          setGlobals(initialGlobalsTransform(data));
        }
        setLoading(false);
      });
    }
  }, [endpoint, initialData]);

  const openCreateEditor = () => {
    setEditingOriginalId(null);
    setEditingItem(createDefaultItem(fields, createDefaults) as T);
  };

  const openEditEditor = (item: T) => {
    setEditingOriginalId(getItemId(item));
    setEditingItem(item);
  };

  const closeEditor = () => {
    setEditingOriginalId(null);
    setEditingItem(null);
  };

  const handleSaveItem = () => {
    if (!editingItem) return;
    setItems(prev => applyItemChange(prev, editingItem, editingOriginalId, getItemId));
    closeEditor();
  };

  const handleDeleteItem = (item: T) => {
    setItems(prev => removeItemById(prev, getItemId(item), getItemId));
  };

  const handleSaveAll = async () => {
    const itemsToSave = editingItem
      ? applyItemChange(items, editingItem, editingOriginalId, getItemId)
      : items;
    try {
      await post(`/.netlify/functions/${endpoint}`, saveDataTransform(itemsToSave, globals));
      alert(`${title} updated and committed successfully!`);
    } catch {
      alert(`Failed to update ${title}.`);
    }
  };

  const validationError = editingItem
    ? validateItemId(items, editingItem, editingOriginalId, getItemId, idFieldName)
    : null;

  if (loading) return <Container sx={{ mt: 4 }}><Typography>Loading...</Typography></Container>;

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">{title}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {creatable && (
            <Button variant="contained" onClick={openCreateEditor} startIcon={<Add />}>Add</Button>
          )}
          <Button variant="contained" color="primary" onClick={handleSaveAll}>Save All Changes</Button>
        </Box>
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
                  <IconButton onClick={() => openEditEditor(item)}>
                    <Edit />
                  </IconButton>
                  {creatable && (
                    <IconButton onClick={() => handleDeleteItem(item)}>
                      <Delete />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editingItem} onClose={closeEditor} maxWidth="md" fullWidth>
        <DialogTitle>{editingOriginalId === null ? 'Add Item' : `Edit: ${getItemId(editingItem || {} as T)}`}</DialogTitle>
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
          {validationError && (
            <Typography color="error" sx={{ mt: 2 }}>{validationError}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditor}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained" disabled={!!validationError}>Save to List</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
