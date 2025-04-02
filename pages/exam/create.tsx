import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { Container, Typography, Box } from '@mui/material';
import NavbarDashboard from '../../components/dashboard/navbar-dashboard';
import CreateExamForm from '../../components/exam/create-exam-form';
import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { LoadingBarRef } from 'react-top-loading-bar';

const CreateExamPage: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loadingBarRef = useRef<LoadingBarRef>(null);

  useEffect(() => {
    // Redirect if not authenticated or not a teacher
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session && session.user && session.user.role !== 'teacher') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (status === 'authenticated' && session.user.role === 'teacher') {
    return (
      <>
        <NavbarDashboard loadingBarRef={loadingBarRef} />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
          <CreateExamForm />
        </Container>
      </>
    );
  }

  return null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  if (session.user.role !== 'teacher') {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default CreateExamPage;