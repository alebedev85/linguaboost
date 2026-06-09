
import { useAppSelector } from "@/store";
import styles from "./Notification.module.scss";

export default function Notification() {
  const notification = useAppSelector((state) => state.ui.notification);

  if (!notification) return null;

  // Маппинг классов под типы уведомлений
  const typeClass =
    notification.type === "success"
      ? styles.success
      : notification.type === "error"
        ? styles.error
        : notification.type === "warning"
          ? styles.warning
          : styles.info;

  return (
    <div className={`${styles.notification} ${typeClass}`}>
      <span>{notification.text}</span>
    </div>
  );
}
