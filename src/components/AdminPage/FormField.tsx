import { TextField, FormControlLabel, Checkbox, Box, Typography, List, ListItem, ListItemText, IconButton, Button, MenuItem } from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import type { FieldConfig } from './types';
import type { SubscriptionItem } from '@/types/data';
import { addOption, addSubscription, removeOption, removeSubscription, updateOption, updateSubscriptionField } from '@/utils/admin-subscriptions';

interface FormFieldProps<T> {
  field: FieldConfig<T>;
  item: T;
  onChange: (updated: T) => void;
}

function KeyValueMapField({ label, value, onChange, valueType }: { label: string; value: Array<Record<string, unknown>>; onChange: (v: Array<Record<string, unknown>>) => void; valueType: 'number' | 'string' }) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6">{label}</Typography>
      <List dense>
        {(value || []).map((pair: Record<string, unknown>, idx: number) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: key-value pairs have no stable id; index is safe within a controlled edit session
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
              // biome-ignore lint/suspicious/noExplicitAny: MUI ListItemText slotProps component prop requires any for custom element
              slotProps={{ secondary: { component: 'div' as any } }}
              primary={
                <TextField 
                  size="small" 
                  fullWidth
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
                  fullWidth
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

function SubscriptionListField({ label, value, onChange }: { label: string; value: unknown; onChange: (v: SubscriptionItem[]) => void }) {
  const list = (value ?? []) as SubscriptionItem[];
  const setList = (next: SubscriptionItem[]) => onChange(next);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6">{label}</Typography>
      <List dense>
        {list.map((subscription, idx) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: subscriptions have no stable id; index is safe within a controlled edit session
          <ListItem key={idx} secondaryAction={
            <IconButton edge="end" aria-label={`Remove subscription ${idx + 1}`} onClick={() => setList(removeSubscription(list, idx))}>
              <Delete />
            </IconButton>
          }>
            <ListItemText
              // biome-ignore lint/suspicious/noExplicitAny: MUI ListItemText slotProps component prop requires any for custom element
              slotProps={{ secondary: { component: 'div' as any } }}
              primary={
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField size="small" fullWidth label="Name" value={subscription.name ?? ''} onChange={e => setList(updateSubscriptionField(list, idx, 'name', e.target.value))} />
                  <TextField size="small" fullWidth label="ID" value={subscription.id ?? ''} onChange={e => setList(updateSubscriptionField(list, idx, 'id', e.target.value))} />
                  <TextField size="small" fullWidth label="Description" multiline rows={2} value={subscription.description ?? ''} onChange={e => setList(updateSubscriptionField(list, idx, 'description', e.target.value))} />
                  <TextField size="small" fullWidth label="Value" value={subscription.value ?? ''} onChange={e => setList(updateSubscriptionField(list, idx, 'value', e.target.value))} />
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="subtitle2">Options</Typography>
                    {(subscription.options || []).map((option, oIdx) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: options have no stable id; index is safe within a controlled edit session
                      <Box key={oIdx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                        <TextField size="small" fullWidth label="Label" value={option.label ?? ''} onChange={e => setList(updateOption(list, idx, oIdx, 'label', e.target.value))} />
                        <TextField size="small" fullWidth label="Value" value={option.value ?? ''} onChange={e => setList(updateOption(list, idx, oIdx, 'value', e.target.value))} />
                        <IconButton aria-label="Remove option" onClick={() => setList(removeOption(list, idx, oIdx))}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Button startIcon={<Add />} onClick={() => setList(addOption(list, idx))}>Add Option</Button>
                  </Box>
                </Box>
              }
            />
          </ListItem>
        ))}
        <Button startIcon={<Add />} onClick={() => setList(addSubscription(list))}>Add Subscription</Button>
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

  const value = item[field.name];
  const updateValue = (newValue: unknown) => {
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
            {(value as string[] || []).map((val: string, idx: number) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: text list values have no stable id; index is safe within a controlled edit session
              <ListItem key={idx} secondaryAction={
                <IconButton edge="end" onClick={() => {
                  const newList = [...(value as string[] || [])];
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
                        const newList = [...(value as string[] || [])];
                        newList[idx] = e.target.value;
                        updateValue(newList);
                      }}
                    />
                  }
                />
              </ListItem>
            ))}
            <Button startIcon={<Add />} onClick={() => {
              updateValue([...(value as string[] || []), '']);
            }}>Add Item</Button>
          </List>
        </Box>
      );
    case 'keyValueMap':
      return (
        <KeyValueMapField label={field.label} value={value as Array<Record<string, unknown>> || []} onChange={updateValue} valueType="number" />
      );
    case 'textKeyValueMap':
      return (
        <KeyValueMapField label={field.label} value={value as Array<Record<string, unknown>> || []} onChange={updateValue} valueType="string" />
      );
    case 'subscriptionList':
      return (
        <SubscriptionListField label={field.label} value={value} onChange={updateValue} />
      );

    case 'select':
      return (
        <TextField 
          select 
          label={field.label} 
          fullWidth 
          value={value ?? ''} 
          onChange={e => updateValue(e.target.value)} 
        >
          <MenuItem value=""><em>Select...</em></MenuItem>
          {(field.options || []).map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
      );

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
