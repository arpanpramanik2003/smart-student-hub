import GrievancesQueue from '@/components/admin/GrievancesQueue';

export const metadata = {
  title: 'Grievances & Appeals | Admin Console',
  description: 'Review and resolve student activity rejection appeals',
};

export default function GrievancesPage() {
  return <GrievancesQueue />;
}
