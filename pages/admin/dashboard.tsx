import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import { useRef } from "react";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";
import AdminDashboard from "../../components/dashboard/admin-dashboard";
import NavBarDashboard from "../../components/dashboard/navbar-dashboard";

const AdminDashboardPage: React.FC = () => {
  const loadingBarRef = useRef<LoadingBarRef>(null);

  return (
    <div>
      <Head>
        <title>Admin Dashboard - Anti-Cheat Exam App</title>
      </Head>
      <LoadingBar color="#ffffff" ref={loadingBarRef} />
      <NavBarDashboard loadingBarRef={loadingBarRef} />
      <AdminDashboard loadingBarRef={loadingBarRef} />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession({ req: context.req });

  // Redirect to login if not authenticated
  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  // Redirect to dashboard if not a teacher
  if (session.user.role !== "teacher") {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default AdminDashboardPage;