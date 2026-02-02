'use client';

import React from 'react';
import { Box, Typography, Breadcrumbs as MuiBreadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export function Breadcrumbs({ items = [] }: BreadcrumbsProps) {
  return (
    <Box
      sx={{
        mb: 3,
        pt: 2,
        '& .MuiBreadcrumbs-separator': {
          color: '#71717a',
        },
      }}
    >
      <MuiBreadcrumbs
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'nowrap',
          },
          '& .MuiBreadcrumbs-li': {
            display: 'flex',
            alignItems: 'center',
          },
        }}
      >
        <MuiLink
          component={Link}
          href="/"
          sx={{
            color: '#71717a',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontFamily: 'sans-serif',
            '&:hover': {
              color: '#3b82f6',
            },
          }}
        >
          Full Orbit
        </MuiLink>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return isLast ? (
            <Typography
              key={index}
              sx={{
                color: '#fafafa',
                fontSize: '0.875rem',
                fontFamily: 'sans-serif',
                fontWeight: 500,
              }}
            >
              {item.label}
            </Typography>
          ) : (
            <MuiLink
              key={index}
              component={Link}
              href={item.href || '#'}
              sx={{
                color: '#71717a',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontFamily: 'sans-serif',
                '&:hover': {
                  color: '#3b82f6',
                },
              }}
            >
              {item.label}
            </MuiLink>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
}

