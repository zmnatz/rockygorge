import { useEffect, useState } from 'react';
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
import { Add, ArrowDownward, ArrowUpward, Delete, Edit } from '@mui/icons-material';
import type { AdminPageProps } from './types';
import { FormField } from './FormField';
import { GenerateFromCalendarPanel } from './GenerateFromCalendarPanel';
import { get, post } from '@/utils/api';
import { applyItemChange, createDefaultItem, createItemFromCalendar, moveItem, removeItemById, validateItemId } from '@/utils/admin-items';

export function AdminPage<T>({
  title,
  endpoint,
  columns,
  fields,
  getItemId,
  initialData,
  initialDataTransform = (data: unknown) => data as T[],
  initialGlobalsTransform,
  saveDataTransform = (items, _globals) => items,
  globalFields,
  editOnly = false,
  reorderable = false,
  createDefaults = {},
  idFieldName = 'id',
  generateFromCalendar = false,
}: AdminPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [globals, setGlobals] = useState<Record<string, unknown>>({});
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [editingOriginalId, setEditingOriginalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialData);

  // biome-ignore lint/correctness/useExhaustiveDependencies: initialDataTransform and initialGlobalsTransform are intentionally read once from initialData; adding them to deps would refetch on every render.
  useEffect(() => {
    if (initialData) {
      setItems(initialDataTransform(initialData));
      if (initialGlobalsTransform) {
        setGlobals(initialGlobalsTransform(initialData));
      }
      setLoading(false);
    } else {
      get<unknown>(`/.netlify/functions/${endpoint}`).then(data => {
        setItems(initialDataTransform(data));
        if (initialGlobalsTransform) {
          setGlobals(initialGlobalsTransform(data));
        }
        setLoading(false);
      });
    }
  }, [endpoint, initialData]);

  const openCreateEditor = (preset?: T) => {
    setEditingOriginalId(null);
    setEditingItem(preset ?? (createDefaultItem(fields, createDefaults) as T));
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

  const handleMoveItem = (index: number, direction: -1 | 1) => {
    setItems(prev => moveItem(prev, index, direction));
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
          {!editOnly && (
            <Button variant="contained" onClick={() => openCreateEditor()} startIcon={<Add />}>Add</Button>
          )}
          <Button variant="contained" color="primary" onClick={handleSaveAll}>Save All Changes</Button>
        </Box>
      </Box>

      {generateFromCalendar && (
        <GenerateFromCalendarPanel
          onSelect={(source) => openCreateEditor(createItemFromCalendar(source, fields, createDefaults) as T)}
        />
      )}

      {globalFields && globalFields.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {globalFields.map(field => (
              <FormField 
                key={field.name} 
                field={field} 
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
              {columns.map((col) => (
                <TableCell key={col.header}>{col.header}</TableCell>
              ))}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={getItemId(item) || idx}>
                {columns.map((col) => (
                  <TableCell key={col.header}>{col.render(item)}</TableCell>
                ))}
                <TableCell align="right">
                  {reorderable && (
                    <>
                      <IconButton onClick={() => handleMoveItem(idx, -1)} disabled={idx === 0} aria-label={`Move ${getItemId(item)} up`}>
                        <ArrowUpward fontSize="small" />
                      </IconButton>
                      <IconButton onClick={() => handleMoveItem(idx, 1)} disabled={idx === items.length - 1} aria-label={`Move ${getItemId(item)} down`}>
                        <ArrowDownward fontSize="small" />
                      </IconButton>
                    </>
                  )}
                  <IconButton onClick={() => openEditEditor(item)}>
                    <Edit />
                  </IconButton>
                  {!editOnly && (
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
