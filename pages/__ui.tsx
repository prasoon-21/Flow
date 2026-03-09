import type { GetServerSideProps } from 'next';
import ShowroomPage from '@/components/showroom/ShowroomPage';

const isShowroomEnabled = () =>
  process.env.NODE_ENV === 'development' ||
  process.env.SHOWROOM_ENABLED === 'true' ||
  process.env.NEXT_PUBLIC_SHOWROOM_ENABLED === 'true';

export const getServerSideProps: GetServerSideProps = async () => {
  if (!isShowroomEnabled()) {
    return { notFound: true };
  }
  return { props: {} };
};

export default function ShowroomRoute() {
  return <ShowroomPage />;
}
