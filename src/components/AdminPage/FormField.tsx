import React from 'react';
import { TextField, FormControlLabel, Checkbox, Box, Typography, List, ListItem, ListItemText, IconButton, Button } from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { FieldConfig } from './types';

interface FormFieldProps<T> {
  field: FieldConfig<T>;
  item: T;
  onChange: (updated: T) => void;
}

export function FormField<T>({ 
  field, 
  item, 
  onChange 
}: FormFieldProps<T>) {
  if (field.render) {
    return <>{field.render(item, onChange)}</>;
  }

  const value = (item as any)[field.name];
  const updateValue = (newValue: any) => {
    onChange({ ...item, [field.name]: newValue });
  };

  switch (field.type) {
    case 'boolean':
      return (
        <FormControlLabel
          control={
            <Checkbox 
              checked={!!value} 
              onChange={e => updateValue(e.target.checked)} 
            />
          }
          label={field.label}
        />
      );
    case 'number':
      return (
        <TextField 
          label={field.label} 
          type="number" 
          fullWidth 
          value={value ?? ''} 
          onChange={e => updateValue(Number(e.target.value))} 
        />
      );
    case 'textarea':
      return (
        <TextField 
          label={field.label} 
          multiline 
          rows={4} 
          fullWidth 
          value={value ?? ''} 
          onChange={e => updateValue(e.target.value)} 
        />
      );
    case 'textList':
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">{field.label}</Typography>
          <List>
            {(value || []).map((val: string, idx: number) => (
              <ListItem key={idx} secondaryAction={
                <IconButton edge="end" onClick={() => {
                  const newList = [...(value || [])];
                  newList.splice(idx, 1);
                  updateValue(newList);
                }}>
                  <Delete />
                </IconButton>
              }>
                <ListItemText 
                  primary={
                    <TextField 
                      size="small" 
                      value={val} 
                      onChange={e => {
                        const newList = [...(value || [])];
                        newList[idx] = e.target.value;
                        updateValue(newList);
                      }}
                    />
                  }
                />
              </ListItem>
            ))}
            <Button startIcon={<Add />} onClick={() => {
              updateValue([...(value || []), '']);
            }}>Add Item</Button>
          </List>
        </Box>
      );
    case 'options':
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">{field.label}</Typography>
          <List>
            {(value || []).map((option: any, idx: number) => (
              <ListItem key={idx} secondaryAction={
                <IconButton edge="end" onClick={() => {
                  const newList = [...(value || [])];
                  newList.splice(idx, 1);
                  updateValue(newList);
                }}>
                  <Delete />
                </IconButton>
              }>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 1 }}>
                  <TextField
                    size="small"
                    label="Key"
                    value={option.name || option.key || ''}
                    onChange={e => {
                      const newList = [...(value || [])];
                      const keyName = option.name !== undefined ? 'name' : 'key';
                      newList[idx][keyName] = e.target.value;
                      updateValue(newList);
                    }}
                    sx={{ flexGrow: 1 }}
                  />
                  <TextField
                    size="small"
                    label="Value"
                    type="number"
                    value={option.value ?? ''}
                    onChange={e => {
                      const newList = [...(value || [])];
                      newList[idx].value = Number(e.target.value);
                      updateValue(newList);
                    }}
                    sx={{ width: 120 }}
                  />
                </Box>
              </ListItem>
            ))}
            <Button startIcon={<Add />} onClick={() => {
              updateValue([...(value || []), { name: '', value: 0 }]);
            }}>Add Option</Button>
          </List>
        </Box>
      );
    case 'text':
    default:
      return (
        <TextField 
          label={field.label} 
          fullWidth 
          value={value ?? ''} 
          onChange={e => updateValue(e.target.value)} 
        />
      );
  }
}
