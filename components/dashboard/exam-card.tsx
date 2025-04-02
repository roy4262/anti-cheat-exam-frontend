import {
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box
} from "@mui/material";
import Link from "next/link";
import { AssignedExam } from "../../models/exam-models";
import classes from "./exam-card.module.scss";
import TimelapseIcon from "@mui/icons-material/Timelapse";
import DateRangeIcon from "@mui/icons-material/DateRange";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import DeleteIcon from "@mui/icons-material/Delete";
import moment from "moment";
import { Stack } from "@mui/system";
import { LoadingBarRef } from "react-top-loading-bar";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { BASE_URL } from "../../constants";

interface ExamCardProps {
  exam: AssignedExam;
  loadingBarRef: React.RefObject<LoadingBarRef>;
  onDelete?: (examId: string) => void;
  isTeacher?: boolean;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, loadingBarRef, onDelete, isTeacher = false }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { data: session } = useSession();
  const startDate = exam.startDate ? new Date(exam.startDate) : new Date();
  const endDate = exam.endDate ? new Date(exam.endDate) : new Date();

  const startDateFormatted = moment(startDate).format("lll");
  const endDateFormatted = moment(endDate).format("lll");

  // Duration is stored in minutes in the database
  const duration = exam.duration;

  const handleStartExam = () => {
    try {
      console.log(`Starting exam: ${exam.name} (${exam._id})`);

      if (loadingBarRef?.current) {
        loadingBarRef.current.continuousStart(50);
      }
    } catch (error) {
      console.error('Error starting exam:', error instanceof Error ? error.message : error);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (loadingBarRef?.current) {
        loadingBarRef.current.continuousStart(50);
      }

      const response = await fetch(`${BASE_URL}/exam/${exam._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.user.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to delete exam');
      }

      toast.success('Exam deleted successfully');

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete(exam._id);
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'An unknown error occurred';
      toast.error(`Failed to delete exam: ${errorMessage}`);
    } finally {
      setDeleteDialogOpen(false);
      if (loadingBarRef?.current) {
        loadingBarRef.current.complete();
      }
    }
  };

  return (
    <div>
      <Card
        sx={{
          boxShadow: "none",
          outline: "solid #eeeeee 2px",
          marginBottom: "16px",
          borderRadius: "8px",
        }}
      >
        <CardContent>
          <Stack direction="row" justifyContent="space-between">
            <Typography
              sx={{ fontSize: 16, marginBottom: "12px", fontWeight: "bold" }}
              color="text.primary"
              gutterBottom
            >
              {exam?.name}
            </Typography>

            <Typography
              sx={{ fontSize: 14, marginBottom: "12px" }}
              color="text.secondary"
              gutterBottom
            >
              ID: {exam?.examId || exam?._id}
            </Typography>
          </Stack>

          {exam?.description && (
            <Typography
              sx={{ fontSize: 14, marginBottom: "12px" }}
              color="text.secondary"
              gutterBottom
            >
              {exam.description}
            </Typography>
          )}

          <Divider sx={{ marginBottom: "12px" }} />

          <List>
            <ListItem>
              <ListItemIcon>
                <DateRangeIcon />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontSize: 14, fontWeight: "medium" }}
              >
                <span className={classes.examDateSpan}>
                  {startDateFormatted}
                </span>
                {" → "}
                <span className={classes.examDateSpan}>
                  {endDateFormatted}
                </span>
              </ListItemText>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <TimelapseIcon />
              </ListItemIcon>
              <ListItemText
                primary={`${duration} Minutes`}
                primaryTypographyProps={{ fontSize: 14, fontWeight: "medium" }}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <FormatListNumberedIcon />
              </ListItemIcon>
              <ListItemText
                primary={`${exam.questionCount || 'Unknown'} Questions`}
                primaryTypographyProps={{ fontSize: 14, fontWeight: "medium" }}
              />
            </ListItem>
          </List>
        </CardContent>

        <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Link href={`/exam/${exam._id}`} passHref>
              <Button
                size="small"
                variant="contained"
                color="primary"
                sx={{ ml: 2, mb: 1 }}
                onClick={handleStartExam}
              >
                {isTeacher ? 'View Exam' : 'Start Exam'}
              </Button>
            </Link>
          </Box>

          {isTeacher && (
            <Box>
              <IconButton
                color="error"
                onClick={handleDeleteClick}
                aria-label="delete exam"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </CardActions>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Exam
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the exam "{exam.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ExamCard;
