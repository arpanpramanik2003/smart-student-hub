import CreditPolicies from '@/components/admin/CreditPolicies';

export const metadata = {
  title: 'Credit Policy Engine | Admin Console',
  description: 'Manage institutional credit policy rules and NAAC criterion mapping',
};

export default function CreditPoliciesPage() {
  return <CreditPolicies />;
}
