import AdminConsole from "./admin-console";
import "./admin.css";

export const metadata = {
  title: "课程智慧中台 | 医美军校",
  description: "课程管理、视频上传、AI 导览与知识语料运营",
};

export default function AdminPage() {
  return <AdminConsole />;
}

