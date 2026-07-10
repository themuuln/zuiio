import { ReturnsContent } from "./returns-content";

export type ReturnRow = {
  id: string;
  return_number: string;
  return_date: string;
  type: string;
  reference_type: string | null;
  reference_id: string | null;
  contact_name: string | null;
  status: string;
  total_amount: number;
  reason: string | null;
};

export default function ReturnsPage() {
  return <ReturnsContent />;
}
