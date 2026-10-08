/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  ArrowRight,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/theme";
import { Navbar } from "@/landingPage/Navbar";
import { Footer } from "@/landingPage/Footer";
import { BackToTop } from "@/landingPage/BackToTop";
import { CustomCursor } from "@/landingPage/CustomCursor";
import { getTrainerById, getTrainers, getTrainerPhoto, updateTrainer } from "@/lib/trainersService";
import { TrainerProfileView } from "@/pages/trainers-members/trainers/TrainerProfileView";

export default function PublicTrainerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [allTrainers, setAllTrainers] = useState([]);
  const [trainer, setTrainer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    let cancelled = false;
    setIsLoading(true);
    Promise.all([getTrainers(), getTrainerById(id)])
      .then(([trainersList, trainerData]) => {
        if (!cancelled) {
          setAllTrainers(Array.isArray(trainersList) ? trainersList : []);
          setTrainer(trainerData);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAllTrainers([]);
          setTrainer(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useDocumentTitle("The Strength Way");

  const otherTrainers = useMemo(() => {
    if (!trainer) return [];
    return allTrainers.filter((t) => t.id !== trainer.id).slice(0, 2);
  }, [allTrainers, trainer]);

  const handleRedirectToTrainers = (e) => {
    if (e) e.preventDefault();
    navigate("/#trainers");
    setTimeout(() => {
      const el = document.getElementById("trainers");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Navbar />
        <main className="pt-32 pb-20 px-6 text-center max-w-xl mx-auto space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent" />
          <p className="text-sm text-muted-foreground">Loading trainer profile…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
        <Navbar />
        <main className="pt-32 pb-20 px-6 text-center max-w-xl mx-auto space-y-6">
          <div className="h-16 w-16 rounded-full bg-white/5 border border-white/10 grid place-items-center mx-auto text-muted-foreground">
            <User size={32} />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">Trainer Not Found</h1>
          <p className="text-sm text-muted-foreground">
            We couldn't find a trainer profile matching <strong className="text-white">{id}</strong>
            .
          </p>
          <button
            type="button"
            onClick={handleRedirectToTrainers}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black hover:bg-white/90 transition-all cursor-pointer shadow-lg"
          >
            <ArrowLeft size={16} />
            <span>Return to All Trainers</span>
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="custom-cursor-scope min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-20 flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Top Back Navigation */}
          <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-6">
            <button
              type="button"
              onClick={handleRedirectToTrainers}
              className="inline-flex items-center gap-2 text-xs font-semibold text-foreground bg-card hover:bg-muted border border-border rounded-full px-4 py-2 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft size={14} />
              <span>Back to All Trainers</span>
            </button>
          </div>

          {/* Unified Reusable Trainer Profile View */}
          <TrainerProfileView
            trainer={trainer}
            onUpdateTrainer={(updated) => {
              updateTrainer(trainer.id, updated);
              setTrainer(updated);
            }}
            isAdmin={false}
            canUploadAccreditations={true}
          />

          {/* Explore Other Trainers Section */}
          {otherTrainers.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground">
                    Explore Other Trainers
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Discover our certified specialists across bodybuilding, calisthenics, and
                    functional flow.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRedirectToTrainers}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground self-start cursor-pointer transition-colors"
                >
                  <span>View All Trainers</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {otherTrainers.map((other) => (
                  <Link
                    key={other.id}
                    to={`/trainers/${other.id}`}
                    className="group flex items-center gap-4 rounded-3xl border border-border bg-card p-4 transition-all hover:border-foreground/30 hover:bg-card/90 shadow-xs"
                  >
                    <img
                      src={getTrainerPhoto(other)}
                      alt={other.name}
                      width={160}
                      height={160}
                      className="h-20 w-20 rounded-2xl object-cover object-top border border-border"
                    />
                    <div className="space-y-1">
                      <h4 className="font-display text-lg font-bold text-foreground group-hover:underline">
                        {other.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {other.experience} Professional Experience
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BackToTop />
      <CustomCursor />
    </div>
  );
}
