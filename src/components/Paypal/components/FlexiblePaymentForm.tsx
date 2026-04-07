import { Card, CardHeader, CardContent, Typography, TextField } from "@mui/material";

export function FlexiblePaymentForm({
  donation,
  value,
  onChange,
}: {
  donation: boolean;
  value: number;
  onChange: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <Card className="big store-card">
      <CardHeader title={donation ? "Flexible Amount" : "Flexible Payment"} />
      <CardContent>
        <Typography>
          If you've arranged to pay a different amount, enter it below before
          clicking {donation ? "Donate" : "Buy Now"}.
        </Typography>
        <TextField
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          size="small"
          sx={{ mt: 1 }}
        />
      </CardContent>
    </Card>
  );
}