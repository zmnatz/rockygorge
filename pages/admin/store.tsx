import React from 'react';
import { 
  Box, 
  TextField, 
  Typography, 
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { AdminPage } from '../../src/components/AdminPage';

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
  return (
    <AdminPage<StoreItem>
      title="Store Admin"
      endpoint="admin-store"
      getItemId={(item) => item.name}
      columns={[
        { header: 'Name', render: (item) => item.name },
        { header: 'Title', render: (item) => item.title },
        { header: 'Hide', render: (item) => item.hide ? 'Yes' : 'No' },
      ]}
      renderEditForm={(item, onChange) => (
        <>
          <TextField 
            label="Title" 
            fullWidth 
            value={item.title || ''} 
            onChange={e => onChange({ ...item, title: e.target.value })} 
          />
          <TextField 
            label="Description" 
            fullWidth 
            value={item.description || ''} 
            onChange={e => onChange({ ...item, description: e.target.value })} 
          />
          <TextField 
            label="Info" 
            fullWidth 
            value={item.info || ''} 
            onChange={e => onChange({ ...item, info: e.target.value })} 
          />
          <TextField 
            label="Default Amount" 
            type="number" 
            fullWidth 
            value={item.defaultAmount || ''} 
            onChange={e => onChange({ ...item, defaultAmount: Number(e.target.value) })} 
          />
          <TextField 
            label="Details" 
            multiline 
            rows={4} 
            fullWidth 
            value={item.details || ''} 
            onChange={e => onChange({ ...item, details: e.target.value })} 
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={item.hide || false} 
                onChange={e => onChange({ ...item, hide: e.target.checked })} 
              />
            }
            label="Hide Item"
          />
          
          <Typography variant="h6">Options</Typography>
          <List>
            {item.options?.map((opt, idx) => (
              <ListItem key={idx} secondaryAction={
                <IconButton edge="end" onClick={() => {
                  const newOpts = [...(item.options || [])];
                  newOpts.splice(idx, 1);
                  onChange({ ...item, options: newOpts });
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
                        const newOpts = [...(item.options || [])];
                        newOpts[idx].name = e.target.value;
                        onChange({ ...item, options: newOpts });
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
                        const newOpts = [...(item.options || [])];
                        newOpts[idx].value = Number(e.target.value);
                        onChange({ ...item, options: newOpts });
                      }}
                    />
                  }
                />
              </ListItem>
            ))}
            <Button startIcon={<Add />} onClick={() => {
              const newOpts = [...(item.options || []), { name: '', value: 0 }];
              onChange({ ...item, options: newOpts });
            }}>Add Option</Button>
          </List>

          <Typography variant="h6">Supporters</Typography>
          <List>
            {item.supporters?.map((supporter, idx) => (
              <ListItem key={idx} secondaryAction={
                <IconButton edge="end" onClick={() => {
                  const newSupps = [...(item.supporters || [])];
                  newSupps.splice(idx, 1);
                  onChange({ ...item, supporters: newSupps });
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
                        const newSupps = [...(item.supporters || [])];
                        newSupps[idx] = e.target.value;
                        onChange({ ...item, supporters: newSupps });
                      }}
                    />
                  }
                />
              </ListItem>
            ))}
            <Button startIcon={<Add />} onClick={() => {
              const newSupps = [...(item.supporters || []), ''];
              onChange({ ...item, supporters: newSupps });
            }}>Add Supporter</Button>
          </List>
        </>
      )}
    />
  );
}

