import { Box, useTheme } from '@mui/material';

const GradientBackground = ({ children, variant = 'primary' }) => {
  const theme = useTheme();
  
  const gradients = {
    primary: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`,
    secondary: `linear-gradient(135deg, ${theme.palette.secondary.main}15 0%, ${theme.palette.primary.main}10 100%)`,
    success: `linear-gradient(135deg, ${theme.palette.success.main}15 0%, ${theme.palette.primary.main}10 100%)`,
    subtle: theme.palette.mode === 'dark' 
      ? 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)'
      : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.05) 100%)',
  };

  return (
    <Box
      sx={{
        background: gradients[variant],
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 20%, ${theme.palette.primary.main}08 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, ${theme.palette.secondary.main}08 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, ${theme.palette.primary.main}05 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        },
      }}
    >
      {children}
    </Box>
  );
};

export default GradientBackground;
