import { useState } from 'react'
import { Box, Button, Container, TextField, Typography, Paper, Alert, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Autocomplete } from '@mui/material'
import { useRouter } from 'next/router'
import { GetStaticProps } from 'next'
import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'

interface GauntletSubmitProps {
    playerNames: string[];
}

export default function GauntletSubmit({ playerNames = [] }: GauntletSubmitProps) {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        time: '',
        stroke: '',
    })
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const validateTime = (time: string) => {
        const timeRegex = /^([0-9]+):([0-9]{1,2}(\.[0-9]+)?)$/;
        return timeRegex.test(time);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus(null)

        if (!validateTime(formData.time)) {
            setStatus({ type: 'error', message: 'Please enter time in a valid format (e.g., 1:45.2)' })
            return
        }

        setSubmitting(true)

        try {
            const response = await fetch('/.netlify/functions/submit-gauntlet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                setStatus({ type: 'success', message: 'Submission received! A pull request has been created for review.' })
                setFormData({ name: '', position: '', time: '', stroke: '' })
            } else {
                const errorData = await response.json()
                setStatus({ type: 'error', message: errorData.error || 'Something went wrong. Please try again.' })
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error. Please check your connection.' })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Submit Your Time
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Submit your results below. Entries are reviewed by an admin before being added to the leaderboard.
                </Typography>

                {status && (
                    <Alert severity={status.type} sx={{ mb: 3 }}>
                        {status.message}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Autocomplete
                        freeSolo
                        options={playerNames}
                        value={formData.name}
                        onChange={(_, newValue) => setFormData({ ...formData, name: newValue || '' })}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Name"
                                required
                                sx={{ mb: 2 }}
                            />
                        )}
                    />
                    <FormControl component="fieldset" sx={{ mb: 2 }}>
                        <FormLabel component="legend">Position</FormLabel>
                        <RadioGroup
                            row
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                        >
                            <FormControlLabel value="forward" control={<Radio />} label="Forward" />
                            <FormControlLabel value="back" control={<Radio />} label="Back" />
                        </RadioGroup>
                    </FormControl>
                    <TextField
                        fullWidth
                        label="Time (e.g. 1:45.2)"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Stroke Rate"
                        name="stroke"
                        type="number"
                        value={formData.stroke}
                        onChange={handleChange}
                        sx={{ mb: 3 }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={submitting}
                        size="large"
                    >
                        {submitting ? 'Submitting...' : 'Submit Entry'}
                    </Button>
                </form>
            </Paper>
        </Container>
    )
}

export const getStaticProps: GetStaticProps = async () => {
    try {
        const filePath = path.join(process.cwd(), 'src/data/stats/stats.yml');
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(fileContents) as any;
        
        const playerNames = new Set<string>();
        if (data && data.games) {
            data.games.forEach((game: any) => {
                if (game.players) {
                    game.players.forEach((player: any) => {
                        if (player.name) playerNames.add(player.name);
                    });
                }
            });
        }

        return { 
            props: { 
                playerNames: Array.from(playerNames).sort(),
            },
        };
    } catch (error) {
        console.error('Error loading player names:', error);
        return { props: { playerNames: [] } };
    }
}
