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

export default function DuesAdmin({ dues }: { dues: Dues[] }) {
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Monthly</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dues.map((entry) => (
              <TableRow key={entry.name}>
                <TableCell>{entry.name}</TableCell>
                <TableCell>{entry.monthly ? 'Yes' : 'No'}</TableCell>
                <TableCell>{entry.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export async function getStaticProps() {
  return {
    props: {
      dues: duesYaml,
    },
  };
}
