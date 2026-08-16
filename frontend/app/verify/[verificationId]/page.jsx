import PublicVerification from '@/components/public/PublicVerification';

export const metadata = {
  title: 'Credential Verification | CampusSphere',
  description: 'Public verification ledger for institutional co-curricular activity records.',
};

export default async function VerifyPage({ params }) {
  const { verificationId } = await params;
  return <PublicVerification verificationId={verificationId} />;
}
