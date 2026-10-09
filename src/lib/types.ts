import type { Design } from "./design";
export type ToyRecord = {
  id: string;
  publicId: string | null;
  name: string;
  status: "DRAFT" | "READY";
  createdAt: string;
  design: { config: Design; version: number };
  payment: { status: string; amount: number } | null;
  entry: { status: string; createdAt: string } | null;
  secret?: { text: string } | null;
};
export type MatchRecord = {
  id: string;
  status: string;
  createdAt: string;
  history: { status: string; at: string }[];
  toy?: { name: string; publicId: string | null };
  shipment?: { trackingCode: string; destination: string } | null;
};
export type CollectionRecord = {
  id: string;
  revealedAt: string;
  match: {
    id: string;
    toy: ToyRecord & {
      creator: { name: string };
      secret: { text: string } | null;
    };
  };
};
export type DashboardData = {
  user: { id: string; name: string; role: string };
  toys: ToyRecord[];
  sent: MatchRecord[];
  incoming: MatchRecord[];
  collection: CollectionRecord[];
  notifications: {
    id: string;
    type: string;
    title: string;
    read: boolean;
    createdAt: string;
  }[];
  poolCount: number;
};
