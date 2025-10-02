import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Avatar,
  Divider,
  TextField,
  Button,
  Snackbar,
  Alert,
  Tooltip,
  Paper,
  Grid,
  Chip,
  IconButton,
  Container,
  alpha,
  useTheme,
  Fade,
  Slide,
  Backdrop,
  LinearProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  PhotoCamera as PhotoCameraIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  LocationCity as LocationIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
  Verified as VerifiedIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import {
  getMyInfo,
  updateProfile,
  uploadAvatar,
} from "../services/userService";
import { isAuthenticated, logOut } from "../services/authenticationService";
import Scene from "./Scene";

export default function Profile({ darkMode, onToggleDarkMode }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [userDetails, setUserDetails] = useState({});
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [dob, setDob] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const fileInputRef = useRef(null);

  const getUserDetails = async () => {
    try {
      setLoading(true);
      const response = await getMyInfo();
      const data = response.data;

      setUserDetails(data.result);
      // Initialize form fields with current values
      setFirstName(data.result.firstName || "");
      setLastName(data.result.lastName || "");
      setEmail(data.result.email || "");
      setCity(data.result.city || "");
      setDob(data.result.dob ? dayjs(data.result.dob) : null);
    } catch (error) {
      if (error.response?.status === 401) {
        logOut();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      // Prepare the data for update
      const profileData = {
        firstName,
        lastName,
        email,
        city,
        dob: dob ? dob.format("YYYY-MM-DD") : null,
      };

      await updateProfile(profileData);

      const updatedDetails = {
        ...userDetails,
        ...profileData,
      };

      setUserDetails(updatedDetails);
      setIsEditing(false);

      // Show success message
      setSnackbarMessage("Profile updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error updating profile:", error);

      // Show error message
      setSnackbarMessage("Failed to update profile. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setUpdating(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form fields to original values
      setFirstName(userDetails.firstName || "");
      setLastName(userDetails.lastName || "");
      setEmail(userDetails.email || "");
      setCity(userDetails.city || "");
      setDob(userDetails.dob ? dayjs(userDetails.dob) : null);
    }
    setIsEditing(!isEditing);
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.match("image.*")) {
      setSnackbarMessage("Please select an image file");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      setUploading(true);

      // Create FormData object
      const formData = new FormData();
      formData.append("file", file);

      // Upload the image
      const response = await uploadAvatar(formData);

      // For demo purposes, create a local URL for the image
      const imageUrl = response.data.result.avatar;

      // Update user details with the new avatar URL
      setUserDetails({
        ...userDetails,
        avatar: imageUrl,
      });

      // Success message
      setSnackbarMessage("Avatar updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setSnackbarMessage("Failed to upload avatar. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setUploading(false);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    } else {
      getUserDetails();
    }
  }, [navigate]);

  return (
    <Scene darkMode={darkMode} onToggleDarkMode={onToggleDarkMode}>
      <Backdrop open={updating} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="primary" />
          <Typography color="white">Updating profile...</Typography>
        </Box>
      </Backdrop>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading ? (
          <Fade in={loading}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                justifyContent: "center",
                alignItems: "center",
                height: "60vh",
              }}
            >
              <CircularProgress size={60} thickness={4} />
              <Typography variant="h6" color="text.secondary">
                Loading your profile...
              </Typography>
            </Box>
          </Fade>
        ) : (
          <Fade in={!loading}>
            <Grid container spacing={4}>
              {/* Profile Header Card */}
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    borderRadius: 4,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                    overflow: 'visible',
                    position: 'relative',
                  }}
                >
                  {/* Decorative Background */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 120,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      borderRadius: '16px 16px 0 0',
                    }}
                  />
                  
                  <CardContent sx={{ pt: 8, pb: 4, textAlign: 'center', position: 'relative' }}>
                    {/* Avatar Section */}
                    <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                      <Avatar
                        src={userDetails.avatar}
                        sx={{
                          width: 120,
                          height: 120,
                          fontSize: 48,
                          bgcolor: theme.palette.background.paper,
                          color: theme.palette.primary.main,
                          cursor: "pointer",
                          transition: 'all 0.3s ease',
                          border: `4px solid ${theme.palette.background.paper}`,
                          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.15)}`,
                          "&:hover": {
                            transform: 'scale(1.05)',
                            boxShadow: `0 12px 32px ${alpha(theme.palette.common.black, 0.2)}`,
                          },
                        }}
                        onClick={handleAvatarClick}
                      >
                        {userDetails.firstName?.[0]}{userDetails.lastName?.[0]}
                      </Avatar>
                      
                      {/* Camera Overlay */}
                      <IconButton
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          bgcolor: theme.palette.primary.main,
                          color: 'white',
                          width: 36,
                          height: 36,
                          '&:hover': {
                            bgcolor: theme.palette.primary.dark,
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                        onClick={handleAvatarClick}
                        size="small"
                      >
                        <PhotoCameraIcon fontSize="small" />
                      </IconButton>
                      
                      {uploading && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            backgroundColor: alpha(theme.palette.common.black, 0.6),
                          }}
                        >
                          <CircularProgress size={32} sx={{ color: "white" }} />
                        </Box>
                      )}
                    </Box>

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileSelect}
                    />

                    {/* User Info */}
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                      }}
                    >
                      {userDetails.firstName} {userDetails.lastName}
                    </Typography>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      @{userDetails.username}
                    </Typography>
                    
                    <Chip
                      icon={<VerifiedIcon />}
                      label="Verified Account"
                      color="success"
                      variant="outlined"
                      size="small"
                      sx={{ mb: 3 }}
                    />

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Chip
                        icon={<BadgeIcon />}
                        label={`ID: ${userDetails.id}`}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Profile Details Card */}
              <Grid item xs={12} md={8}>
                <Card
                  sx={{
                    borderRadius: 4,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    height: 'fit-content',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="primary" />
                        Profile Information
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {isEditing ? (
                          <>
                            <Button
                              variant="contained"
                              startIcon={<SaveIcon />}
                              onClick={handleUpdate}
                              disabled={updating}
                              sx={{ borderRadius: 2 }}
                            >
                              Save Changes
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<CancelIcon />}
                              onClick={handleEditToggle}
                              disabled={updating}
                              sx={{ borderRadius: 2 }}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={handleEditToggle}
                            sx={{ borderRadius: 2 }}
                          >
                            Edit Profile
                          </Button>
                        )}
                      </Box>
                    </Box>

                    {updating && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

                    <Grid container spacing={3}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                gap: "20px",
                mb: "30px",
              }}
            >
              <Tooltip title="Click to upload a profile picture">
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    src={userDetails.avatar}
                    sx={{
                      width: 120,
                      height: 120,
                      fontSize: 48,
                      bgcolor: "#1976d2",
                      cursor: "pointer",
                      transition: "opacity 0.3s",
                      "&:hover": {
                        opacity: 0.8,
                      },
                    }}
                    onClick={handleAvatarClick}
                  >
                    {userDetails.firstName?.[0]}
                    {userDetails.lastName?.[0]}
                  </Avatar>
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0,
                      transition: "opacity 0.3s",
                      borderRadius: "50%",
                      backgroundColor: "rgba(0, 0, 0, 0.4)",
                      "&:hover": {
                        opacity: 1,
                      },
                      cursor: "pointer",
                    }}
                    onClick={handleAvatarClick}
                  >
                    <PhotoCameraIcon sx={{ color: "white", fontSize: 36 }} />
                  </Box>
                  {uploading && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                      }}
                    >
                      <CircularProgress size={36} sx={{ color: "white" }} />
                    </Box>
                  )}
                </Box>
              </Tooltip>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              <Typography
                sx={{
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {userDetails.username}
              </Typography>
              <Divider sx={{ width: "100%", mb: "10px" }} />
            </Box>
            <Typography
              sx={{
                fontSize: 18,
                mb: "20px",
              }}
            >
              Welcome back to Management Project, {userDetails.username} !
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                width: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                User Id
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                }}
              >
                {userDetails.id}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                First Name
              </Typography>
              <TextField
                size="small"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                sx={{ width: "60%" }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Last Name
              </Typography>
              <TextField
                size="small"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                sx={{ width: "60%" }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Email
              </Typography>
              <TextField
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ width: "60%" }}
                type="email"
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                City
              </Typography>
              <TextField
                size="small"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                sx={{ width: "60%" }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Date of birth
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={dob}
                  onChange={(newValue) => setDob(newValue)}
                  slotProps={{ textField: { size: "small" } }}
                  sx={{ width: "60%" }}
                />
              </LocalizationProvider>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                mt: 3,
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpdate}
                sx={{ px: 4 }}
              >
                Update Profile
              </Button>
            </Box>
          </Box>
        </Card>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "30px",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress></CircularProgress>
          <Typography>Loading ...</Typography>
        </Box>
      )}
    </Scene>
  );
}
