import { Grid } from "@mui/material";
import { GetServerSideProps } from "next";
import { getSession, useSession } from "next-auth/react";
import React, { useEffect, useRef, useState, MutableRefObject } from "react";
import AppBarExam from "../../components/exam/app-bar-exam";
import ExamButtonsGroup from "../../components/exam/exam-buttons";
import ExamCamera from "../../components/exam/exam-camera";
import QuestionTracker from "../../components/exam/question-tracker";
import QuestionWidget from "../../components/exam/question-widget";
import { getExam } from "../../helpers/api/exam-api";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { Exam } from "../../models/exam-models";
import { examActions } from "../../store/exam-store";
import { toast } from "react-toastify";
import {
  getBrowserDocumentHiddenProp,
  getBrowserVisibilityProp,
  getVisibilityEventNames,
  usePageVisibility,
} from "../../helpers/app/visibility-event";
import WarningModal from "../../components/exam/exam-modals";
import { useRouter } from "next/router";
import Head from "next/head";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";

const TESTING = false;

// TODO (CHEAT DETECTION):
//
// If change tab more than 3 times, submit exam
//
// Disable back button
//
// Save answer keys and timer after every answer selection
// Create new API for it
//
// If user starts exam again without submitting exam, then
// Then load answers and keys
// Only within given time period of exam
//
// Cannot give exam again after submitting
// TODO (UI):
//
// This screen should be full screen
// Timer state changes saved every 30 secs
//
// Block interactions while loading
//

interface ExamPageProps {
  exam: Exam;
  error: string;
}

const ExamPage: React.FC<ExamPageProps> = ({ exam, error }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const loadingBarRef: React.Ref<LoadingBarRef> = useRef(null);

  const activeExam = useAppSelector((state) => state.exam.activeExam);

  const [didLeaveExam, setDidLeaveExam] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    description: string;
  }>();

  // Ref to track the last visibility change time to prevent double-counting
  const lastVisibilityChangeTimeRef = useRef<number>(0);
  const VISIBILITY_CHANGE_THROTTLE_MS = 1000; // Minimum time between visibility changes (1 second)

  // Track if we're running in the browser
  const [isBrowser, setIsBrowser] = useState(false);

  // Set isBrowser to true once the component mounts
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Load exam into state
  useEffect(() => {
    if (!exam) {
      console.error('No exam data available');
      return;
    }

    console.log('Loading exam into state:', exam);
    console.log('Exam questions:', exam.questions);
    console.log('Question count:', exam.questionCount);
    console.log('Actual questions length:', exam.questions ? exam.questions.length : 0);

    dispatch(examActions.setActiveExam(exam));

    return () => {
      dispatch(examActions.clearActiveExam());
    };
  }, [dispatch, exam]);

  // Prevent refresh
  useEffect(() => {
    // Only run in browser environment
    if (!isBrowser) return;

    const beforeUnloadEventHandler = (event: BeforeUnloadEvent) => {
      event.preventDefault();

      const warningMessage = "Are you sure you want to leave the exam?";

      if (event) {
        event.returnValue = warningMessage; // Legacy method for cross browser support
      }

      return warningMessage;
    };

    window.addEventListener("beforeunload", beforeUnloadEventHandler, {
      capture: true,
    });

    return () => {
      window.removeEventListener("beforeunload", beforeUnloadEventHandler, {
        capture: true,
      });
    };
  }, [isBrowser]);

  // Tab change
  useEffect(() => {
    // Only run in browser environment
    if (!isBrowser) return;

    const hiddenProp = getBrowserDocumentHiddenProp();
    const visibilityChangeEventName = getBrowserVisibilityProp();

    // Only proceed if we have valid properties
    if (!hiddenProp || !visibilityChangeEventName) {
      console.warn('Browser visibility properties not supported');
      return;
    }

    const handleVisibilityChange = () => {
      const now = Date.now();

      // Throttle visibility changes to prevent double-counting
      if (now - lastVisibilityChangeTimeRef.current < VISIBILITY_CHANGE_THROTTLE_MS) {
        console.log('Ignoring rapid visibility change (throttled)');
        return;
      }

      lastVisibilityChangeTimeRef.current = now;

      if (document[hiddenProp as keyof Document]) {
        // User is leaving the exam page
        console.log('User is leaving the exam page');
        setDidLeaveExam(true);
      } else {
        // User has returned to the exam page
        console.log('User has returned to the exam page, didLeaveExam:', didLeaveExam);
        if (didLeaveExam) {
          // Get current tab change count from localStorage for redundancy
          let currentCount = 0;

          if (isBrowser && activeExam && activeExam.exam && activeExam.exam._id) {
            try {
              const storedCount = localStorage.getItem(`exam_${activeExam.exam._id}_tab_switches`);
              if (storedCount) {
                const parsedCount = parseInt(storedCount, 10);
                if (!isNaN(parsedCount)) {
                  currentCount = parsedCount;
                }
              }
            } catch (e) {
              console.error('Error reading tab switch count from localStorage:', e);
            }
          }

          showModal(
            "WARNING!",
            `Leaving exam multiple times may be flagged as cheating! You have switched tabs ${currentCount} times. You can switch tabs up to 10 times before automatic submission.`
          );
        }
      }
    };

    document.addEventListener(
      visibilityChangeEventName,
      handleVisibilityChange,
      false
    );

    return () => {
      if (visibilityChangeEventName) {
        document.removeEventListener(
          visibilityChangeEventName,
          handleVisibilityChange
        );
      }
    };
  }, [isBrowser, didLeaveExam, activeExam]); // Add isBrowser and activeExam as dependencies

  const showModal = (title: string, description: string) => {
    setIsModalVisible(true);
    setModalData({
      title,
      description,
    });
  };

  const hideModel = () => {
    // Only proceed if we're in the browser and the user left the exam
    if (!isBrowser || !didLeaveExam) {
      return;
    }

    setIsModalVisible(false);
    setModalData({
      title: "",
      description: "",
    });

    // Reset the didLeaveExam flag
    setDidLeaveExam(false);

    // Safety check for activeExam
    if (!activeExam || !activeExam.exam || !activeExam.exam._id) {
      console.error('Cannot track tab changes: No active exam');
      return;
    }

    // Get current tab change count before incrementing
    const currentCount = activeExam.tabChangeCount || 0;

    // Dispatch the action to increase the count in Redux
    dispatch(examActions.increaseTabChangeCount());

    // Log the tab change count for debugging
    console.log('TAB CHANGE DETECTED:');
    console.log(`- Current count: ${currentCount}`);
    console.log(`- New count will be: ${currentCount + 1}`);

    // Store tab change count in localStorage for redundancy
    try {
      const examId = activeExam.exam._id;
      const newCount = currentCount + 1;
      localStorage.setItem(`exam_${examId}_tab_switches`, newCount.toString());
      console.log(`- Stored in localStorage with key: exam_${examId}_tab_switches`);

      // Check if we've exceeded the tab change limit
      if (newCount >= 10) {
        toast.error("You've changed tabs more than 10 times. Your exam will be submitted automatically!");

        // Find the End Exam button and trigger a click on it
        setTimeout(() => {
          const endExamButton = document.querySelector('button[color="warning"]');
          if (endExamButton && endExamButton instanceof HTMLButtonElement) {
            console.log('Auto-submitting exam due to excessive tab changes');
            endExamButton.click();
          } else {
            console.error('Could not find End Exam button for auto-submission');
            // Fallback: redirect to dashboard
            router.replace("/dashboard");
          }
        }, 2000); // Give the user 2 seconds to see the toast message
      } else if (newCount >= 5) {
        // Just show a warning at 5 tab changes
        toast.warning(`Warning: You've changed tabs ${newCount} times. Excessive tab switching may result in automatic submission.`);
      }
    } catch (e) {
      console.error('Error handling tab change count:', e);
    }
  };

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <Head>
          <title>Error - Exam</title>
        </Head>
        <LoadingBar color="#1665C0" ref={loadingBarRef} />
        <h2>Error Loading Exam</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <p>Please try again or contact support if the problem persists.</p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '10px 15px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Return to Dashboard
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 15px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!activeExam) {
    console.log('Active exam not found in Redux store');

    // If we have exam data from props but it's not in the store yet, try to set it
    if (exam) {
      console.log('Setting exam from props into Redux store');
      dispatch(examActions.setActiveExam(exam));

      // Return a loading indicator while the store updates
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <h2>Preparing Exam...</h2>
            <p>Please wait while we set up your exam.</p>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading Exam...</h2>
          <p>Please wait while we load your exam.</p>
        </div>
      </div>
    );
  }

  if (activeExam.exam._id !== exam._id) {
    console.error(`Exam ID mismatch: ${activeExam.exam._id} !== ${exam._id}`);
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Error Loading Exam</h2>
        <p style={{ color: 'red' }}>The exam data is inconsistent. Please try again.</p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '10px 15px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <React.Fragment>
      <Head>
        <title>{exam.name}</title>
      </Head>

      <LoadingBar color="#ffffff" ref={loadingBarRef} />

      <AppBarExam
        examName={activeExam.exam.name}
        loadingBarRef={loadingBarRef}
      />

      <Grid
        container
        direction="row"
        sx={{
          height: "calc(100% - 4rem)",
        }}
      >
        <Grid item xs={9}>
          <Grid
            container
            direction="column"
            height="100%"
            justifyContent="space-between"
          >
            <Grid item>
              <QuestionWidget />
            </Grid>
            <Grid item>
              <ExamButtonsGroup />
              {/* <p>Exam Leave Count: {activeExam.tabChangeCount}</p> */}
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={3}>
          <Grid
            container
            direction="column"
            height="100%"
            justifyContent="space-between"
          >
            <Grid item>
              <QuestionTracker />
            </Grid>
            <Grid item>
              {isBrowser && <ExamCamera />}
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Only render browser-specific components when in browser environment */}
      {isBrowser && !TESTING && (
        <WarningModal
          open={isModalVisible}
          title={modalData?.title || ""}
          description={modalData?.description || ""}
          onClose={hideModel}
        />
      )}
    </React.Fragment>
  );
};

const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession({ req: context.req });

  // TODO: Pass query "redirect_to", and use that for redirection
  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  // Safely extract examId from params with type checking
  const examId = context.params?.examId;
  if (!examId || Array.isArray(examId)) {
    throw new Error("Invalid exam ID");
  }

  try {
    console.log(`Fetching exam ${examId} for user ${session.user.email}`);

    // Make sure we have a token
    if (!session.user.token) {
      throw new Error("No authentication token available");
    }

    const exam = await getExam(
      examId,
      session.user.token
    );

    if (!exam) {
      throw new Error("Failed to get exam!");
    }

    console.log("Exam fetched successfully:", exam.name);

    return {
      props: {
        exam: exam,
        error: null,
      },
    };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Failed to get exam!";
    console.error("Error fetching exam:", errorMessage);

    return {
      props: {
        exam: null,
        error: errorMessage,
      },
    };
  }
};

export default ExamPage;
export { getServerSideProps };
