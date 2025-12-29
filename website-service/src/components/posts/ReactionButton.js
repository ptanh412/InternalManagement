import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Popover,
  Typography,
  Stack,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  Favorite as FavoriteIcon,
  SentimentVerySatisfied as HahaIcon,
  EmojiEmotions as WowIcon,
  SentimentDissatisfied as SadIcon,
  Whatshot as AngryIcon,
} from '@mui/icons-material';
import postApiService from '../../services/postApiService';
import socketIOService from '../../services/socketIOService';

// Reaction type mapping
const REACTIONS = {
  LIKE: { label: 'Like', icon: ThumbUpIcon, color: '#1877f2', emoji: '👍' },
  LOVE: { label: 'Love', icon: FavoriteIcon, color: '#f33e58', emoji: '❤️' },
  HAHA: { label: 'Haha', icon: HahaIcon, color: '#f7b125', emoji: '😆' },
  WOW: { label: 'Wow', icon: WowIcon, color: '#f7b125', emoji: '😮' },
  SAD: { label: 'Sad', icon: SadIcon, color: '#f7b125', emoji: '😢' },
  ANGRY: { label: 'Angry', icon: AngryIcon, color: '#e9710f', emoji: '😠' },
};

const ReactionPicker = ({ onReactionSelect, currentReaction, anchorEl, onClose }) => {
  const open = Boolean(anchorEl);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      PaperProps={{
        sx: {
          borderRadius: 5,
          p: 1,
          backgroundColor: 'white',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        },
      }}
    >
      <Stack direction="row" spacing={0.5}>
        {Object.entries(REACTIONS).map(([type, reaction]) => {
          const ReactionIcon = reaction.icon;
          const isSelected = currentReaction === type;

          return (
            <Tooltip key={type} title={reaction.label} arrow>
              <IconButton
                onClick={() => onReactionSelect(type)}
                sx={{
                  transition: 'all 0.2s',
                  transform: isSelected ? 'scale(1.3)' : 'scale(1)',
                  '&:hover': {
                    transform: 'scale(1.4)',
                  },
                }}
              >
                <Box
                  sx={{
                    fontSize: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {reaction.emoji}
                </Box>
              </IconButton>
            </Tooltip>
          );
        })}
      </Stack>
    </Popover>
  );
};

const ReactionButton = ({ targetId, targetType, reactions = [], currentUserId, onReactionUpdate }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const buttonRef = useRef(null);

  // Find user's current reaction
  const userReaction = reactions.find((r) => r.userId === currentUserId);
  const currentReactionType = userReaction?.reactionType;

  // Count reactions by type
  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
    return acc;
  }, {});

  const totalReactions = reactions.length;

  const handleOpenPicker = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePicker = () => {
    setAnchorEl(null);
  };

  const handleReactionSelect = async (reactionType) => {
    if (isProcessing) return;

    setIsProcessing(true);
    handleClosePicker();

    try {
      // ✅ Generate unique request ID
      const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const payload = { 
        requestId, // ✅ THÊM
        targetId, 
        targetType, 
        reactionType 
      };
      
      const conn = socketIOService.getConnectionStatus();
      if (conn.isPostConnected) {
        console.log('Emitting reaction:toggle with requestId:', requestId);
        socketIOService.emitPost('reaction:toggle', payload);
      } else {
        // HTTP fallback
        const response = await postApiService.toggleReaction(payload);
        if (onReactionUpdate) {
          onReactionUpdate(response.result);
        }
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickLike = async () => {
    if (isProcessing) return;

    // If already liked, remove; otherwise, add like
    const reactionType = currentReactionType === 'LIKE' ? null : 'LIKE';
    
    setIsProcessing(true);
    try {
      const payload = { targetId, targetType, reactionType: 'LIKE' };
      const conn = socketIOService.getConnectionStatus();
      if (conn.isPostConnected) {
        // Just emit - parent component will handle broadcast
        socketIOService.emitPost('reaction:toggle', payload);
      } else {
        // HTTP fallback
        const response = await postApiService.toggleReaction(payload);
        if (onReactionUpdate) {
          onReactionUpdate(response.result);
        }
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get the icon for current reaction
  const getCurrentIcon = () => {
    if (!currentReactionType) {
      return <ThumbUpIcon />;
    }
    const reaction = REACTIONS[currentReactionType];
    const ReactionIcon = reaction.icon;
    return <ReactionIcon sx={{ color: reaction.color }} />;
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title={currentReactionType ? REACTIONS[currentReactionType].label : 'Like'}>
          <IconButton
            ref={buttonRef}
            onClick={handleQuickLike}
            onMouseEnter={handleOpenPicker}
            size="small"
            disabled={isProcessing}
            sx={{
              color: currentReactionType ? REACTIONS[currentReactionType].color : 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            {getCurrentIcon()}
          </IconButton>
        </Tooltip>

        {totalReactions > 0 && (
          <Tooltip
            title={
              <Box>
                {Object.entries(reactionCounts).map(([type, count]) => (
                  <Typography key={type} variant="caption" display="block">
                    {REACTIONS[type].emoji} {REACTIONS[type].label}: {count}
                  </Typography>
                ))}
              </Box>
            }
          >
            <Typography variant="caption" color="text.secondary" sx={{ cursor: 'pointer' }}>
              {totalReactions}
            </Typography>
          </Tooltip>
        )}
      </Box>

      <ReactionPicker
        anchorEl={anchorEl}
        onClose={handleClosePicker}
        onReactionSelect={handleReactionSelect}
        currentReaction={currentReactionType}
      />
    </>
  );
};

export { ReactionButton, ReactionPicker, REACTIONS };
