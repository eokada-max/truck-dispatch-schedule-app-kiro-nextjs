import { LocationsClient } from "./LocationsClient";

export const metadata = {
  title: "場所マスタ管理 | スケジュール管理",
  description: "積み地・着地の場所マスタを管理します",
};

export default function LocationsPage() {
  return <LocationsClient />;
}
