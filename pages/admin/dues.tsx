import { 
  Accordion, 
  AccordionDetails, 
  AccordionSummary, 
  Box, 
  Container, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography 
} from '@mui/material';
import duesYaml from '@content/admin/dues.yaml';
import type { Dues } from '@/types/data';

function DuesTable({ title, entries, defaultOpen }: { title: string; entries: Dues[]; defaultOpen?: boolean }) {
  return (
    <Accordion defaultExpanded={defaultOpen}>
      <AccordionSummary>
        <Typography variant="h6">
          {title} ({entries.length})
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.name}>
                  <TableCell>{entry.name}</TableCell>
                  <TableCell>{entry.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
}

export default function DuesAdmin({ monthlyDues, regularPayments, supporterDues }: { monthlyDues: Dues[]; regularPayments: Dues[]; supporterDues: Dues[] }) {
  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dues
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Members who have paid club dues.
        </Typography>
      </Box>

      <DuesTable title="Monthly Dues" entries={monthlyDues} defaultOpen />
      <DuesTable title="Regular Payments" entries={regularPayments} />
      <DuesTable title="Supporter Dues" entries={supporterDues} />
    </Container>
  );
}

function sortByName(entries: Dues[]): Dues[] {
  return [...entries].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStaticProps() {
  const monthlyDues = sortByName(duesYaml.filter((entry) => entry.monthly && !entry.supporter));
  const regularPayments = sortByName(duesYaml.filter((entry) => !entry.monthly && !entry.supporter));
  const supporterDues = sortByName(duesYaml.filter((entry) => entry.supporter));

  return {
    props: {
      monthlyDues,
      regularPayments,
      supporterDues,
    },
  };
}