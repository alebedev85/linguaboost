"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAppSelector } from "@/store";

import AuthForm from "@/components/auth/AuthForm/AuthForm";
import DictionaryList from "@/components/dictionary/DictionaryList/DictionaryList";
import WordForm from "@/components/dictionary/WordForm/WordForm";
import ProfileManager from "@/components/profiles/ProfileManager/ProfileManager";
import TrainingManager from "@/components/training/TrainingManager/TrainingManager";
import Loader from "@/components/ui/Loader/Loader";

import styles from "./page.module.scss";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loadingScreen}>
          <div className={styles.loadingContent}>
            <Loader />
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const { user, loading, error } = useAuth();
  const activeTab = useAppSelector((state) => state.ui.activeTab);

  const searchParams = useSearchParams();
  const isRegisterRequested = searchParams.get("mode") === "register";

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingContent}>
          <Loader />

          <p className={styles.loadingText}>
            Инициализация вашей персональной базы слов...
          </p>

          {error && (
            <p className="text-red-500 mt-4">
              Ошибка Firebase: {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.authWrapper}>
        <AuthForm initialRegisterMode={isRegisterRequested} />
      </div>
    );
  }

  const renderContent = (): React.ReactNode => {
    switch (activeTab) {
      case "learn":
        return <TrainingManager />;
      case "add":
        return <WordForm />;
      case "dictionary":
        return <DictionaryList />;
      case "profiles":
        return <ProfileManager />;
      default:
        return <TrainingManager />;
    }
  };

  return <main className={styles.main}>{renderContent()}</main>;
}