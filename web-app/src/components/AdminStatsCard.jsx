import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  LinearProgress,
} from '@mui/material';

const AdminStatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'primary', 
  trend = null,
  progress = null,
  subtitle = null 
}) => {
  const getColorStyles = (color) => {
    const colorMap = {
      primary: {
        bg: 'primary.main',
        text: 'primary.contrastText',
      },
      success: {
        bg: 'success.main',
        text: 'success.contrastText',
      },
      info: {
        bg: 'info.main',
        text: 'info.contrastText',
      },
      warning: {
        bg: 'warning.main',
        text: 'warning.contrastText',
      },
      error: {
        bg: 'error.main',
        text: 'error.contrastText',
      },
      secondary: {
        bg: 'secondary.main',
        text: 'secondary.contrastText',
      },
    };
    
    return colorMap[color] || colorMap.primary;
  };

  const colorStyles = getColorStyles(color);

  return (
    <Card sx={{ 
      bgcolor: colorStyles.bg, 
      color: colorStyles.text,
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      '&::before': progress !== null ? {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        bgcolor: 'rgba(255, 255, 255, 0.2)',
      } : {},
    }}>
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" component="div">
              {value}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box mt={0.5}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    opacity: 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
                  {trend.value}% {trend.period}
                </Typography>
              </Box>
            )}
          </Box>
          {Icon && (
            <Box>
              <Icon sx={{ 
                fontSize: 40, 
                opacity: 0.8,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }} />
            </Box>
          )}
        </Box>
      </CardContent>
      
      {progress !== null && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            '& .MuiLinearProgress-bar': {
              bgcolor: 'rgba(255, 255, 255, 0.8)',
            },
          }}
        />
      )}
    </Card>
  );
};

export default AdminStatsCard;
