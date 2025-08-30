import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { createConversation } from "../services/chatService";

const DEPARTMENT_TYPES = [
  { value: "GROUP", label: "Department Group" },
  { value: "DIRECT", label: "Direct" },
];

export default function CreateDepartmentConversationDialog({ open, onClose, onCreated }) {
  const [departmentName, setDepartmentName] = useState("");
  const [type, setType] = useState("GROUP");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      // You may want to fetch participantIds based on department members
      const response = await createConversation({
        type,
        participantIds: [], // Fill with department user IDs as needed
        departmentName,
      });
      onCreated?.(response.data.result);
      onClose();
    } catch (e) {
      setError("Failed to create department conversation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Create Department Conversation</DialogTitle>
      <DialogContent>
        <TextField
          label="Department Name"
          fullWidth
          value={departmentName}
          onChange={(e) => setDepartmentName(e.target.value)}
          margin="normal"
        />
        <TextField
          select
          label="Conversation Type"
          fullWidth
          value={type}
          onChange={(e) => setType(e.target.value)}
          margin="normal"
        >
          {DEPARTMENT_TYPES.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        {error && (
          <div style={{ color: "red", marginTop: 8 }}>{error}</div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!departmentName || loading}
          startIcon={loading ? <CircularProgress size={18} /> : null}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
