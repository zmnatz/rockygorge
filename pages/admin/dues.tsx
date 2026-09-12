import { 
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

function DuesTable({ title, entries }: { title: string; entries: Dues[] }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
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
    </Box>
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

      <DuesTable title="Monthly Dues" entries={monthlyDues} />
      <DuesTable title="Regular Payments" entries={regularPayments} />
      <DuesTable title="Supporter Dues" entries={supporterDues} />
    </Container>
  );
}

function sortNewestFirst(entries: Dues[]): Dues[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getStaticProps() {
  const monthlyDues = sortNewestFirst(duesYaml.filter((entry) => entry.monthly));
  const regularPayments = sortNewestFirst(duesYaml.filter((entry) => !entry.monthly));
  const supporterDues = sortNewestFirst(duesYaml.filter((entry) => entry.supporter));

  return {
    props: {
      monthlyDues,
      regularPayments,
      supporterDues,
    },
  };
}