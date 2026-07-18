import { TextField, FormControlLabel, Checkbox, Box, Typography, List, ListItem, ListItemText, IconButton, Button } from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { FieldConfig } from './types';

interface FormFieldProps<T> {
  field: FieldConfig<T>;
  item: T;
  onChange: (updated: T) => void;
}

function KeyValueMapField({ label, value, onChange, valueType }: { label: string; value: any[]; onChange: (v: any[]) => void; valueType: 'number' | 'string' }) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6">{label}</Typography>
      <List>
        {(value || []).map((pair: any, idx: number) => (
          <ListItem key={idx} secondaryAction={
            <IconButton edge="end" onClick={() => {
              const newList = [...(value || [])];
              newList.splice(idx, 1);
              onChange(newList);
            }}>
              <Delete />
            </IconButton>
          }>
            <ListItemText 
              slotProps={{ secondary: { component: 'div' as any } }}
              primary={
                <TextField 
                  size="small" 
                  label="Key" 
                  value={pair.name || pair.key || ''} 
                  onChange={e => {
                    const newList = [...(value || [])];
                    const keyName = pair.name !== undefined ? 'name' : 'key';
                    newList[idx][keyName] = e.target.value;
                    onChange(newList);
                  }}
                />
              }
              secondary={
                <TextField 
                  size="small" 
                  label="Value" 
                  type={valueType === 'number' ? 'number' : undefined}
                  value={pair.value ?? ''} 
                  onChange={e => {
                    const newList = [...(value || [])];
                    newList[idx].value = valueType === 'number' ? Number(e.target.value) : e.target.value;
                    onChange(newList);
                  }}
                />
              }
            />
          </ListItem>
        ))}
        <Button startIcon={<Add />} onClick={() => {
          onChange([...(value || []), { name: '', value: valueType === 'number' ? 0 : '' }]);
        }}>Add Pair</Button>
      </List>
    </Box>
  );
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
    case 'keyValueMap':
      return (
        <KeyValueMapField label={field.label} value={value || []} onChange={updateValue} valueType="number" />
      );
    case 'textKeyValueMap':
      return (
        <KeyValueMapField label={field.label} value={value || []} onChange={updateValue} valueType="string" />
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
