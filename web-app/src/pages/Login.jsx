import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  TextField,
  Typography,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  Fade,
  Slide,
  Paper,
  Avatar,
  Container,
  Link,
  useTheme,
  alpha,
} from "@mui/material";

import {
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon,
  AutoStories as BookIcon,
  GitHub as GitHubIcon,
  Facebook as FacebookIcon,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logIn, isAuthenticated } from "../services/authenticationService";

export default function Login() {
  const navigate = useNavigate();
  const theme = useTheme();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  const handleCloseSnackBar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackBarOpen(false);
  };

  const handleGoogleClick = () => {
    alert(
      "Please refer to Oauth2 series for this implementation guidelines. https://www.youtube.com/playlist?list=PL2xsxmVse9IbweCh6QKqZhousfEWabSeq"
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await logIn(username, password);
      console.log("Response body:", response.data);
      if (response.data.result.admin){
        navigate("/admin");
      }else{
        navigate("/");
      }
    } catch (error) {
      const errorResponse = error.response?.data;
      setSnackBarMessage(errorResponse?.message || "An error occurred");
      setSnackBarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <Snackbar
        open={snackBarOpen}
        onClose={handleCloseSnackBar}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackBar}
          severity="error"
          variant="filled"
          sx={{ 
            width: "100%",
            borderRadius: 2,
            '& .MuiAlert-icon': {
              fontSize: '1.5rem',
            }
          }}
        >
          {snackBarMessage}
        </Alert>
      </Snackbar>

      {/* Background with gradient */}
      <Box
        sx={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: "120%",
            height: "120%",
            background: `radial-gradient(circle at 20% 50%, ${alpha(theme.palette.primary.light, 0.3)} 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.light, 0.3)} 0%, transparent 50%), radial-gradient(circle at 40% 80%, ${alpha(theme.palette.primary.dark, 0.2)} 0%, transparent 50%)`,
            animation: "float 20s ease-in-out infinite",
            '@keyframes float': {
              '0%, 100%': {
                transform: 'translateY(0px) rotate(0deg)',
              },
              '50%': {
                transform: 'translateY(-20px) rotate(180deg)',
              },
            },
          }}
        />

        <Container
          maxWidth="sm"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            position: "relative",
            zIndex: 1,
            py: 4,
          }}
        >
          <Fade in={mounted} timeout={800}>
            <Paper
              elevation={24}
              sx={{
                width: "100%",
                maxWidth: 480,
                borderRadius: 4,
                overflow: "hidden",
                background: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: "blur(20px)",
                border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
              }}
            >
              {/* Header Section */}
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  color: "white",
                  p: 4,
                  textAlign: "center",
                  position: "relative",
                }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: "auto",
                    mb: 2,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.secondary.main, 0.4)}`,
                  }}
                >
                  <BookIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 700,
                    mb: 1,
                    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    opacity: 0.9,
                    fontSize: "1.1rem",
                  }}
                >
                  Sign in to your Bookteria account
                </Typography>
              </Box>

              <CardContent sx={{ p: 4 }}>
                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  {/* Username Field */}
                  <TextField
                    label="Username"
                    variant="outlined"
                    fullWidth
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                        },
                        "&.Mui-focused": {
                          transform: "translateY(-2px)",
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                        },
                      },
                    }}
                  />

                  {/* Password Field */}
                  <TextField
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    variant="outlined"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                        },
                        "&.Mui-focused": {
                          transform: "translateY(-2px)",
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                        },
                      },
                    }}
                  />

                  {/* Forgot Password Link */}
                  <Box sx={{ textAlign: "right" }}>
                    <Link
                      href="#"
                      variant="body2"
                      sx={{
                        color: theme.palette.primary.main,
                        textDecoration: "none",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={isLoading}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                        transform: "translateY(-2px)",
                        boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.5)}`,
                      },
                      "&:active": {
                        transform: "translateY(0px)",
                      },
                      "&:disabled": {
                        background: theme.palette.action.disabledBackground,
                        color: theme.palette.action.disabled,
                      },
                    }}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  {/* Divider */}
                  <Box sx={{ display: "flex", alignItems: "center", my: 2 }}>
                    <Divider sx={{ flex: 1 }} />
                    <Typography variant="body2" sx={{ mx: 2, color: "text.secondary" }}>
                      or continue with
                    </Typography>
                    <Divider sx={{ flex: 1 }} />
                  </Box>

                  {/* Social Login Buttons */}
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={handleGoogleClick}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        color: theme.palette.text.primary,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          background: alpha(theme.palette.primary.main, 0.05),
                          transform: "translateY(-2px)",
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                        },
                      }}
                    >
                      <GoogleIcon sx={{ mr: 1 }} />
                      Google
                    </Button>
                    <IconButton
                      sx={{
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        borderRadius: 2,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          background: alpha(theme.palette.primary.main, 0.05),
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <GitHubIcon />
                    </IconButton>
                    <IconButton
                      sx={{
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        borderRadius: 2,
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          background: alpha(theme.palette.primary.main, 0.05),
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <FacebookIcon />
                    </IconButton>
                  </Box>

                  {/* Sign Up Link */}
                  <Box sx={{ textAlign: "center", mt: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Don't have an account?{" "}
                      <Link
                        href="#"
                        sx={{
                          color: theme.palette.primary.main,
                          fontWeight: 600,
                          textDecoration: "none",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        Create an account
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Paper>
          </Fade>
        </Container>
      </Box>
    </>
  );
}
