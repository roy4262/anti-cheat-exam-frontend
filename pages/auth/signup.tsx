import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Head from "next/head";
import { useRef } from "react";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";
import SignupForm from "../../components/auth/signup-form";
import NavBarHome from "../../components/home/navbar-home";

const SignupPage = () => {
  const loadingBarRef: React.Ref<LoadingBarRef> = useRef(null);

  return (
    <div>
      <Head>
        <title>Anti-Cheat Exam App Signup</title>
      </Head>

      <LoadingBar color="#1665C0" ref={loadingBarRef} />

      <NavBarHome loadingBarRef={loadingBarRef} />
      <SignupForm loadingBarRef={loadingBarRef} />
    </div>
  );
};

const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession({ req: context.req });

  if (session) {
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

export { getServerSideProps };
export default SignupPage;