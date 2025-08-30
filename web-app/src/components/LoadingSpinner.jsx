import React from 'react';
import { Box, CircularProgress, Typography, keyframes } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  70% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.7;
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

export const LoadingSpinner = ({ size = 40, message = "Loading..." }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          animation: `${pulse} 2s ease-in-out infinite`,
        }}
      >
        <CircularProgress
          size={size}
          thickness={3}
          sx={{
            color: theme.palette.primary.main,
            filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.3))',
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: '50%',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              opacity: 0.8,
              animation: `${pulse} 1.5s ease-in-out infinite`,
            }}
          />
        </Box>
      </Box>
      
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontWeight: 500,
            letterSpacing: 0.5,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export const SkeletonLoader = ({ width = '100%', height = 20, variant = 'rectangular' }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        width,
        height,
        borderRadius: variant === 'circular' ? '50%' : theme.shape.borderRadius,
        background: `linear-gradient(90deg, ${theme.palette.divider} 25%, transparent 37%, ${theme.palette.divider} 63%)`,
        backgroundSize: '400% 100%',
        animation: `${shimmer} 1.4s ease-in-out infinite`,
      }}
    />
  );
};

export default LoadingSpinner;
