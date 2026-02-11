'use client';

import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

interface MotionSectionProps {
  children: ReactNode;
  id?: string;
}

export function MotionSection({ children, id }: MotionSectionProps) {
  return (
    <Box
      id={id}
      component={motion.section}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      {children}
    </Box>
  );
}

