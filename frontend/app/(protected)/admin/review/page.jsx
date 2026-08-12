import FinalReviewQueue from '@/components/admin/FinalReviewQueue';

export const metadata = {
  title: 'Final Review Queue | Admin Console',
  description: 'Stage 2 final approval queue for mentor-approved activity submissions',
};

export default function AdminReviewPage() {
  return <FinalReviewQueue />;
}
