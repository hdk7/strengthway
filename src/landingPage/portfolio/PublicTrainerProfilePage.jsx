/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/theme";
import { Navbar } from "@/landingPage/Navbar";
import { Footer } from "@/landingPage/Footer";
import { BackToTop } from "@/landingPage/BackToTop";
import { CustomCursor } from "@/landingPage/CustomCursor";
import { getTrainerById, getTrainers, getTrainerPhoto, updateTrainer } from "@/lib/trainersService";
import { CertifiedAccreditations } from "@/pages/trainers-members/trainers/CertifiedAccreditations";

export default function PublicTrainerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [allTrainers, setAllTrainers] = useState(() => getTrainers());
  const [trainer, setTrainer] = useState(() => getTrainerById(id));

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const trainersList = getTrainers();
    setAllTrainers(trainersList);
    setTrainer(getTrainerById(id));
  }, [id]);

  const pageTitle = trainer
    ? `${trainer.name} — Trainer Profile | The Strength Way`
    : "Trainer Profile — The Strength Way";
  useDocumentTitle(pageTitle);

  const trainerPhoto = useMemo(() => {
    return getTrainerPhoto(trainer);
  }, [trainer]);

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
    <div className="custom-cursor-scope min-h-screen min-h-[100dvh] flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-20 flex-1">
        <div className="mx-auto max-w-[100rem] px-6 lg:px-12 space-y-10">
          {/* Top Breadcrumb & Back Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <Link to="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <ChevronRight size={13} />
              <button
                type="button"
                onClick={handleRedirectToTrainers}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Trainers
              </button>
              <ChevronRight size={13} />
              <span className="text-foreground font-medium">{trainer.name}</span>
            </div>

            <button
              type="button"
              onClick={handleRedirectToTrainers}
              className="inline-flex items-center gap-2 text-xs font-semibold text-foreground hover:text-foreground bg-muted/60 hover:bg-accent/20 border border-border rounded-full px-4 py-2 transition-all cursor-pointer self-start sm:self-auto"
            >
              <ArrowLeft size={14} />
              <span>Back to All Trainers</span>
            </button>
          </div>

          {/* Hero Trainer Profile Card */}
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card/90 to-background p-6 sm:p-10 lg:p-12 shadow-sm backdrop-blur-xl">
            {/* Glowing Background Orbs */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
            <div className="pointer-events-none absolute left-1/3 -bottom-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
              {/* Trainer Portrait with Clean Image (No badges / No ID overlay) */}
              <div className="lg:col-span-4 flex justify-center lg:justify-start">
                <div className="relative group w-full max-w-sm rounded-3xl overflow-hidden border-2 border-border/80 bg-card shadow-lg">
                  <img
                    src={trainerPhoto}
                    alt={trainer.name}
                    width={800}
                    height={1000}
                    className="h-[420px] w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Trainer Information */}
              <div className="lg:col-span-8 space-y-6">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight">
                  {trainer.name}
                </h1>

                {/* Bio / Quote */}
                <blockquote className="rounded-2xl border-l-4 border-primary bg-muted/30 p-4 sm:p-5 text-sm sm:text-base italic text-foreground">
                  "{trainer.quote || trainer.bio}"
                </blockquote>
              </div>
            </div>
          </div>

          {/* Trainer Official Profile & Form Details Grid */}
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
                Official Roster Specifications
              </div>
              <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                Trainer Profile
              </h2>
              <p className="text-sm text-muted-foreground">
                Verified identification, athletic background, and certified coaching credentials
                registered in The Strength Way directory.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              {/* Form Details Dossier Table */}
              <div className="lg:col-span-5 space-y-6">
                <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
                    <ShieldCheck size={18} className="text-emerald-500" />
                    <span>Personal Details & Identification</span>
                  </h3>

                  <dl className="mt-6 divide-y divide-border text-sm">
                    <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="font-medium text-muted-foreground">Full Name</dt>
                      <dd className="mt-1 font-semibold text-foreground sm:col-span-2 sm:mt-0">
                        {trainer.name}
                      </dd>
                    </div>

                    <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="font-medium text-muted-foreground">Trainer ID</dt>
                      <dd className="mt-1 font-mono font-semibold text-emerald-500 sm:col-span-2 sm:mt-0">
                        {trainer.id}
                      </dd>
                    </div>

                    <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="font-medium text-muted-foreground">Experience</dt>
                      <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0">
                        {trainer.experience} Professional Coaching
                      </dd>
                    </div>

                    <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="font-medium text-muted-foreground">Email</dt>
                      <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center gap-2">
                        <Mail size={14} className="text-muted-foreground" />
                        <a
                          href={`mailto:${trainer.email}`}
                          className="hover:text-primary hover:underline truncate"
                        >
                          {trainer.email}
                        </a>
                      </dd>
                    </div>

                    <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="font-medium text-muted-foreground">Phone</dt>
                      <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center gap-2">
                        <Phone size={14} className="text-muted-foreground" />
                        <span>{trainer.phone}</span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Certified Accreditations Document Uploads */}
              <div className="lg:col-span-7">
                <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
                  <CertifiedAccreditations
                    trainer={trainer}
                    onUpdateTrainer={(updated) => {
                      updateTrainer(trainer.id, updated);
                      setTrainer(updated);
                    }}
                    canUpload={true}
                  />
                </div>
              </div>
            </div>
          </div>

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
