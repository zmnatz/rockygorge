import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from "@mui/material";

interface PaymentOptionProps {
  description: string;
  value: number;
  onChange: ((event: React.ChangeEvent<HTMLInputElement>, value: string) => void);
  options: {name: string, value: unknown}[];
}

export function PaymentOptions({description, value, onChange, options}: PaymentOptionProps) {
  return <FormControl>
    <FormLabel>{description}</FormLabel>
    <RadioGroup value={value} onChange={onChange}>
      {options.map(({ name, value }) => (
        <FormControlLabel
          key={name}
          value={value}
          control={<Radio />}
          label={name} />
      ))}
    </RadioGroup>
  </FormControl>;
}