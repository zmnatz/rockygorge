import { Box, List, ListItem, ListItemButton, ListItemText, Paper, Typography, CircularProgress } from '@mui/material';
import { useCalendarSourceItems } from '@/api/calendar';
import { formatStartDate } from '@/utils/calendar';
import type { CalendarSourceItem } from '@/components/CalendarCard/types';

interface CalendarItemListProps {
  items: CalendarSourceItem[];
  onSelect: (item: CalendarSourceItem) => void;
}

export function CalendarItemList({ items, onSelect }: CalendarItemListProps) {
  return (
    <List dense>
      {items.map((item) => (
        <ListItem
          key={item.htmlLink || `${item.summary}-${item.start}`}
          disablePadding
        >
          <ListItemButton onClick={() => onSelect(item)}>
            <ListItemText primary={item.summary} secondary={formatStartDate(item.start)} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

interface GenerateFromCalendarPanelProps {
  onSelect: (item: CalendarSourceItem) => void;
}

export function GenerateFromCalendarPanel({ onSelect }: GenerateFromCalendarPanelProps) {
  const { data, isFetching, error } = useCalendarSourceItems();

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6" gutterBottom>
          Generate from calendar
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pick an upcoming calendar item to open the editor pre-filled as a draft.
        </Typography>
      </Box>
      {isFetching && <CircularProgress size={20} />}
      {!isFetching && error && (
        <Typography color="error">Failed to load calendar items.</Typography>
      )}
      {!isFetching && !error && data && data.length === 0 && (
        <Typography color="text.secondary">No upcoming calendar items.</Typography>
      )}
      {!isFetching && !error && data && data.length > 0 && (
        <CalendarItemList items={data} onSelect={onSelect} />
      )}
    </Paper>
  );
}
