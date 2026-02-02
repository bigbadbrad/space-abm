// /components/home/home-hero-money.tsx
import React from 'react';
import { Box, Container, Typography, Button, Card, CardContent, Divider, List, ListItem, ListItemText } from '@mui/material';
import type { FC } from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface HomeHeroProps {
  backgroundColor?: string;
}

export const HomeHero: FC<HomeHeroProps> = ({ backgroundColor = '#000000' }) => {
  return (
    <>
    <Box
      sx={{
        backgroundColor: '#000000',
        pt: { xs: 0, md: 4 },
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="md" sx={{ pt: { xs: 2, md: 24 }, pb: 4 }}>
        <Typography color="#ffffff" variant="h2" component="h2" sx={{ textAlign: 'center', mb: 4 }}>
          We build the AI factories<br /> that live in space.
        </Typography>
        <Typography color="text.secondary" variant="h5" sx={{ textAlign: 'center' }}>
          From the first commercial lunar data server to petabyte-class orbital data center nodes on the ISS, SpaceBilt designs and integrates the servers, storage, and infrastructure that turn stations into Orbital AI Factories – and all of it runs on our Orbital Data Stack.
        </Typography>
      </Container>


        <Container maxWidth="md" sx={{ px: { xs: 2, md: 0 }, pb: 16 }}>
        <Typography color="#ffffff" variant="h6" sx={{ mt: 28, mb: 0, textAlign: { xs: 'left', md: 'center' }, }}>
            INTRODUCING THE
            </Typography>
        <Typography
            variant="h1"
            sx={{
            mb: 5,
            mt: 2,
            textAlign: { xs: 'left', md: 'center' },
            backgroundImage: 'linear-gradient(180deg, #004C94 45%, #297BC4 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: {
            xs: '4.4rem',   // small on mobile
            sm: '4.5rem', // slightly larger tablet
            md: '5rem',   // full h1 on desktop
        },
            }}
        >
          Orbital AI Factory
        </Typography>


            <Typography variant="h5" color="text.secondary" sx={{ mt: 3, textAlign: { xs: 'left', md: 'center' }, }}>
            An Orbital AI Factory is a cluster of nodes in orbit that turns raw data into decisions: AI running next to telescopes, sensor constellations, stations, and in-space factories. Under the hood, every Orbital AI Factory runs on our Orbital Data Stack — the infrastructure that makes a data center work in space.
            </Typography>
            <Typography variant="h5" color="white" sx={{ mt: 4, mb: 4, textAlign: { xs: 'left', md: 'center' }, }}>
            SpaceBilt isn't just talking about it. We've already flown the core layers of that stack:
            </Typography>
            <List sx={{ 
              color: '#ffffff',
              '& .MuiListItemText-primary': {
                fontSize: '1.25rem'
              }
            }}>
              <ListItem disableGutters>
                <ListItemText primary="✅  Compute + storage layer: Large in-Space Server (LiSS), the world's first 100+ TB orbital data server, flight-qualified on the ISS." />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText primary="✅  Data center node layer: Axiom Orbital Data Center Node on the ISS, where SpaceBilt leads engineering and integration of optically interconnected, petabyte-class infrastructure." />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText primary="✅  Lunar and cislunar layer: The first commercial data server to the Moon, generating real performance data in deep-space environments." />
              </ListItem>
            </List>
        </Container>

    </Box>
    </>
  );
};
