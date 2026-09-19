import {
  Package, ClipboardList, Wrench, FileCheck, Gauge, Settings, MessageSquare,
  CheckCircle2, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";
import type { ModuleAccent, ModuleSection } from "./modulesData";

const ICONS: Record<string, typeof Package> = {
  package: Package,
  clipboard: ClipboardList,
  wrench: Wrench,
  filecheck: FileCheck,
  gauge: Gauge,
  settings: Settings,
  message: MessageSquare,
};

/** Classes completas por acento — necessárias para o Tailwind detectá-las. */
const ACCENT: Record<ModuleAccent, {
  text: string; badgeBg: string; badgeBorder: string; badgeText: string;
  iconBg: string; cardHover: string; button: string; glow: string;
}> = {
  emerald: { text: "text-emerald-400", badgeBg: "bg-emerald-600/15", badgeBorder: "border-emerald-500/25", badgeText: "text-emerald-300", iconBg: "bg-emerald-500/10", cardHover: "hover:border-emerald-500/40", button: "bg-emerald-600 hover:bg-emerald-500", glow: "bg-emerald-600/10" },
  blue: { text: "text-blue-400", badgeBg: "bg-blue-600/15", badgeBorder: "border-blue-500/25", badgeText: "text-blue-300", iconBg: "bg-blue-500/10", cardHover: "hover:border-blue-500/40", button: "bg-blue-600 hover:bg-blue-500", glow: "bg-blue-600/10" },
  orange: { text: "text-orange-400", badgeBg: "bg-orange-600/15", badgeBorder: "border-orange-500/25", badgeText: "text-orange-300", iconBg: "bg-orange-500/10", cardHover: "hover:border-orange-500/40", button: "bg-orange-600 hover:bg-orange-500", glow: "bg-orange-600/10" },
  cyan: { text: "text-cyan-400", badgeBg: "bg-cyan-600/15", badgeBorder: "border-cyan-500/25", badgeText: "text-cyan-300", iconBg: "bg-cyan-500/10", cardHover: "hover:border-cyan-500/40", button: "bg-cyan-600 hover:bg-cyan-500", glow: "bg-cyan-600/10" },
  indigo: { text: "text-indigo-400", badgeBg: "bg-indigo-600/15", badgeBorder: "border-indigo-500/25", badgeText: "text-indigo-300", iconBg: "bg-indigo-500/10", cardHover: "hover:border-indigo-500/40", button: "bg-indigo-600 hover:bg-indigo-500", glow: "bg-indigo-600/10" },
  purple: { text: "text-purple-400", badgeBg: "bg-purple-600/15", badgeBorder: "border-purple-500/25", badgeText: "text-purple-300", iconBg: "bg-purple-500/10", cardHover: "hover:border-purple-500/40", button: "bg-purple-600 hover:bg-purple-500", glow: "bg-purple-600/10" },
  sky: { text: "text-sky-400", badgeBg: "bg-sky-600/15", badgeBorder: "border-sky-500/25", badgeText: "text-sky-300", iconBg: "bg-sky-500/10", cardHover: "hover:border-sky-500/40", button: "bg-sky-600 hover:bg-sky-500", glow: "bg-sky-600/10" },
};

interface Props {
  module: ModuleSection;
  index: number;
  onAccess: () => void;
}

export const ModuleSectionBlock = ({ module, index, onAccess }: Props) => {
  const accent = ACCENT[module.accent];
  const Icon = ICONS[module.iconKey] ?? Package;
  const reversed = index % 2 === 1;

  return (
    <section
      id={module.id}
      className={`relative py-20 md:py-24 overflow-hidden border-b border-white/5 ${
        reversed ? "bg-[#0d1a2d]/30" : ""
      }`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute top-1/2 ${reversed ? "right-0" : "left-0"} -translate-y-1/2 w-[520px] h-[520px] ${accent.glow} rounded-full blur-3xl opacity-70`}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Coluna de apresentação */}
          <div className={`lg:col-span-5 ${reversed ? "lg:order-2" : ""}`}>
            <Reveal direction={reversed ? "right" : "left"}>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${accent.badgeBg} border ${accent.badgeBorder} rounded-full mb-6`}>
                <Icon className={`w-4 h-4 ${accent.text}`} />
                <span className={`text-xs font-semibold ${accent.badgeText} uppercase tracking-wide`}>
                  {module.eyebrow}
                </span>
              </div>
            </Reveal>

            <Reveal direction={reversed ? "right" : "left"} delay={80}>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-5 leading-tight">
                {module.title} <span className={accent.text}>{module.highlight}</span>
              </h2>
            </Reveal>

            <Reveal direction={reversed ? "right" : "left"} delay={140}>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">{module.description}</p>
            </Reveal>

            <ul className="space-y-3 mb-8">
              {module.highlights.map((item, i) => (
                <Reveal as="li" key={item} direction="up" delay={200 + i * 80} className="flex items-start gap-3">
                  <CheckCircle2 className={`w-5 h-5 ${accent.text} flex-shrink-0 mt-0.5`} />
                  <span className="text-gray-300 text-sm">{item}</span>
                </Reveal>
              ))}
            </ul>

            <Reveal direction="up" delay={420}>
              <Button onClick={onAccess} className={`${accent.button} text-white gap-2 px-6`}>
                Acessar módulo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Reveal>
          </div>

          {/* Grade de funcionalidades */}
          <div className={`lg:col-span-7 ${reversed ? "lg:order-1" : ""}`}>
            <Reveal direction="up">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                {module.features.length} funcionalidades disponíveis
              </p>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {module.features.map((feature, i) => (
                <Reveal
                  key={feature.name}
                  direction="up"
                  delay={60 * i}
                  className="h-full"
                >
                  <div className={`h-full bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 ${accent.cardHover} hover:-translate-y-1`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`p-1.5 rounded-lg ${accent.iconBg}`}>
                        <CheckCircle2 className={`w-4 h-4 ${accent.text}`} />
                      </span>
                      <h3 className="text-white font-semibold text-sm">{feature.name}</h3>
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed">{feature.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModuleSectionBlock;
