import { GetServerSideProps } from "next";
import { getSession, useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useRef } from "react";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";
import Dashboard from "../../components/dashboard/dashboard";
import NavBarDashboard from "../../components/dashboard/navbar-dashboard";
import { getUserAssignedExams } from "../../helpers/api/exam-api";
import { useAppDispatch } from "../../hooks";
import { AssignedExam } from "../../models/exam-models";
import { examActions } from "../../store/exam-store";

interface DashboardPageProps {
  exams: AssignedExam[];
  error: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ exams, error }) => {
  const dispatch = useAppDispatch();
  const loadingBarRef: React.Ref<LoadingBarRef> = useRef(null);

  useEffect(() => {
    if (!exams) {
      console.log("No exams data available");
      return;
    }

    console.log(`Dashboard received ${exams.length} exams:`, exams);
    dispatch(examActions.setAssignedExams(exams));
  }, [dispatch, exams]);

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Error Loading Dashboard</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <p>Please try refreshing the page or contact support if the problem persists.</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 15px',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Anti-Cheat Exam App Dashboard</title>
      </Head>
      <LoadingBar color="#ffffff" ref={loadingBarRef} />
      <NavBarDashboard loadingBarRef={loadingBarRef} />
      <Dashboard loadingBarRef={loadingBarRef} />
    </div>
  );
};

const getServerSideProps: GetServerSideProps = async (context) => {
  console.log("Dashboard getServerSideProps called");

  const session = await getSession({ req: context.req });
  console.log("Session:", session ? "Found" : "Not found");

  if (!session) {
    console.log("No session found, redirecting to login");
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  console.log("User in session:", session.user?.email);

  if (!session.user?.token) {
    console.log("No token found in session, redirecting to login");
    return {
      redirect: {
        destination: "/auth/login?error=no_token",
        permanent: false,
      },
    };
  }

  try {
    console.log("Fetching assigned exams with token");

    // Try to get assigned exams, but don't fail the page load if it doesn't work
    let assignedExams = [];
    try {
      // Use the new email-based function to get assigned exams
      assignedExams = await getUserAssignedExams(session.user.token);
      console.log("Assigned exams fetched:", assignedExams ? assignedExams.length : 0);
    } catch (fetchError) {
      console.error("Error fetching assigned exams:", fetchError);
      // Continue with empty exams array
    }

    return {
      props: {
        exams: assignedExams || [],
        error: null,
      },
    };
  } catch (e) {
    console.error("Unhandled error in getServerSideProps:", e);
    return {
      props: {
        exams: [],
        error: e.message ?? "Error loading dashboard. Please try again.",
      },
    };
  }
};

export default DashboardPage;
export { getServerSideProps };
