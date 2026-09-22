/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/theme";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { BackToTop } from "@/components/site/BackToTop";
import { CustomCursor } from "@/components/site/CustomCursor";
import { Reveal } from "@/components/site/Reveal";
import { getTrainerById, getTrainers, getTrainerPhoto } from "@/lib/trainersService";

export default function PublicTrainerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trainer, setTrainer] = useState(null);
  const [allTrainers, setAllTrainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsLoading(true);
    const trainersList = getTrainers();
    setAllTrainers(trainersList);

    // Support both ID matching ("TRN-101") and slug/name matching
    const found =
      getTrainerById(id) ||
      trainersList.find(
        (t) =>
          t.id.toLowerCase() === (id || "").toLowerCase() ||
          t.name.toLowerCase().replace(/\s+/g, "-") === (id || "").toLowerCase(),
      );

    setTrainer(found || null);
    setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white mx-auto" />
          <p className="text-sm text-muted-foreground">Loading trainer profile…</p>
        </div>
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
    <div className="custom-cursor-scope min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-[100rem] px-6 lg:px-12 space-y-10">
          {/* Top Breadcrumb & Back Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <Link to="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <ChevronRight size={13} />
              <button
                type="button"
                onClick={handleRedirectToTrainers}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Trainers
              </button>
              <ChevronRight size={13} />
              <span className="text-white font-medium">{trainer.name}</span>
            </div>

            <button
              type="button"
              onClick={handleRedirectToTrainers}
              className="inline-flex items-center gap-2 text-xs font-semibold text-white/90 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 transition-all cursor-pointer self-start sm:self-auto"
            >
              <ArrowLeft size={14} />
              <span>Back to All Trainers</span>
            </button>
          </div>

          {/* Hero Trainer Profile Card */}
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-surface/80 via-surface/40 to-background p-6 sm:p-10 lg:p-12 shadow-2xl backdrop-blur-xl">
              {/* Glowing Background Orbs */}
              <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
              <div className="pointer-events-none absolute left-1/3 -bottom-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

              <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
                {/* Trainer Portrait with Clean Image (No badges / No ID overlay) */}
                <div className="lg:col-span-4 flex justify-center lg:justify-start">
                  <div className="relative group w-full max-w-sm rounded-3xl overflow-hidden border-2 border-white/20 bg-black/60 shadow-2xl">
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
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                        <Clock size={13} />
                        <span>{trainer.shift || "Morning Shift"}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                        <Sparkles size={13} />
                        <span>{trainer.experience} Experience</span>
                      </span>
                    </div>

                    <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
                      {trainer.name}
                    </h1>
                  </div>

                  {/* Bio / Quote */}
                  <blockquote className="rounded-2xl border-l-4 border-white/80 bg-white/5 p-4 sm:p-5 text-sm sm:text-base italic text-white/90">
                    "{trainer.quote || trainer.bio}"
                  </blockquote>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Trainer Official Profile & Form Details Grid */}
          <div className="space-y-6">
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/60 font-mono">
                Official Roster Specifications
              </div>
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                Trainer Profile & Form Details
              </h2>
              <p className="text-sm text-muted-foreground">
                Verified identification, shift scheduling, and coaching credentials registered in
                The Strength Way directory.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              {/* Form Details Dossier Table */}
              <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-surface/40 p-6 sm:p-8 backdrop-blur-md">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <span>Personal & Coaching Specifications</span>
                </h3>

                <dl className="mt-6 divide-y divide-white/10 text-sm">
                  <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-white/60">Full Name</dt>
                    <dd className="mt-1 font-semibold text-white sm:col-span-2 sm:mt-0">
                      {trainer.name}
                    </dd>
                  </div>

                  <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-white/60">Trainer ID</dt>
                    <dd className="mt-1 font-mono font-semibold text-emerald-400 sm:col-span-2 sm:mt-0">
                      {trainer.id}
                    </dd>
                  </div>

                  <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-white/60">Specialization</dt>
                    <dd className="mt-1 font-semibold text-white sm:col-span-2 sm:mt-0">
                      {trainer.specialization}
                    </dd>
                  </div>

                  <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-white/60">Experience</dt>
                    <dd className="mt-1 text-white sm:col-span-2 sm:mt-0">
                      {trainer.experience} Professional Coaching
                    </dd>
                  </div>

                  <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-white/60">Coaching Shift</dt>
                    <dd className="mt-1 text-white sm:col-span-2 sm:mt-0 flex items-center gap-2">
                      <Clock size={14} className="text-white/60" />
                      <span>{trainer.shift || "Morning (06:00 - 14:00)"}</span>
                    </dd>
                  </div>

                  <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-white/60">Floor Location</dt>
                    <dd className="mt-1 text-white sm:col-span-2 sm:mt-0 flex items-center gap-2">
                      <MapPin size={14} className="text-white/60" />
                      <span>{trainer.floorZone || "Main Strength Floor & Functional Turf"}</span>
                    </dd>
                  </div>

                  <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-white/60">Official Email</dt>
                    <dd className="mt-1 text-white sm:col-span-2 sm:mt-0 flex items-center gap-2">
                      <Mail size={14} className="text-white/60" />
                      <a
                        href={`mailto:${trainer.email}`}
                        className="hover:text-white hover:underline"
                      >
                        {trainer.email}
                      </a>
                    </dd>
                  </div>

                  <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-white/60">Desk Phone</dt>
                    <dd className="mt-1 text-white sm:col-span-2 sm:mt-0 flex items-center gap-2">
                      <Phone size={14} className="text-white/60" />
                      <span>{trainer.phone}</span>
                    </dd>
                  </div>

                  <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-white/60">Languages</dt>
                    <dd className="mt-1 text-white sm:col-span-2 sm:mt-0 flex items-center gap-2">
                      <Globe size={14} className="text-white/60" />
                      <span>{(trainer.languages || ["English", "Hindi"]).join(", ")}</span>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Verified Accreditations & Programs Handled */}
              <div className="lg:col-span-5 space-y-6">
                <div className="rounded-3xl border border-white/10 bg-surface/40 p-6 sm:p-8 backdrop-blur-md">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                    <Award size={18} className="text-white" />
                    <span>Certified Accreditations</span>
                  </h3>
                  <ul className="mt-5 space-y-3">
                    {(
                      trainer.certifications || [
                        "CrossFit Level 2 Coach",
                        "CSCS Specialist",
                        "ACE Certified Personal Trainer",
                        "Functional Movement Screen (FMS)",
                      ]
                    ).map((cert) => (
                      <li key={cert} className="flex items-start gap-2.5 text-xs text-white">
                        <CheckCircle2 size={16} className="mt-0.5 text-emerald-400 shrink-0" />
                        <span className="font-medium leading-relaxed">{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl border border-white/10 bg-surface/40 p-6 sm:p-8 backdrop-blur-md">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                    <Flame size={18} className="text-white" />
                    <span>Programs & Classes Led</span>
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(
                      trainer.programs || [
                        "Functional Strength",
                        "Animal Flow & Mobility",
                        "Athletic Conditioning",
                        "Kettlebell Mastery",
                      ]
                    ).map((prog) => (
                      <span
                        key={prog}
                        className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs font-semibold text-white"
                      >
                        {prog}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Explore Other Coaches Section */}
          {otherTrainers.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-2xl font-bold text-white">
                    Explore Other Coaches
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Discover our certified specialists across bodybuilding, calisthenics, and
                    functional flow.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRedirectToTrainers}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white self-start cursor-pointer transition-colors"
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
                    className="group flex items-center gap-4 rounded-3xl border border-white/10 bg-surface/40 p-4 transition-all hover:border-white/30 hover:bg-surface/70"
                  >
                    <img
                      src={getTrainerPhoto(other)}
                      alt={other.name}
                      width={160}
                      height={160}
                      className="h-20 w-20 rounded-2xl object-cover object-top border border-white/15"
                    />
                    <div className="space-y-1">
                      <h4 className="font-display text-lg font-bold text-white group-hover:underline">
                        {other.name}
                      </h4>
                      <p className="text-xs text-white/80 font-medium">{other.specialization}</p>
                      <p className="text-xs text-white/50">
                        {other.experience} • {other.shift}
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
