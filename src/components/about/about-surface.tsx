"use client";

import {
  ArrowRight,
  CalendarDays,
  Cpu,
  EyeOff,
  Gauge,
  Home,
  Library,
  ListChecks,
  Lock,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import type { ComponentType } from "react";
import { Badge, buttonClasses, Eyebrow } from "@/components/ui/primitives";
import {
  ANALYSIS_PROFILES,
  FEEDBACK_THRESHOLDS,
  POSE_SAMPLING,
  UPLOAD_LIMITS,
} from "@/lib/analysis/profiles";
import type { Exercise, Surface } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AboutSurfaceProps {
  catalog: Exercise[];
  onNavigate: (surface: Surface) => void;
}

const PILLARS: {
  surface: Surface;
  icon: ComponentType<{ className?: string }>;
  title: string;
  summary: string;
  bullets: string[];
  action: string;
}[] = [
  {
    surface: "analyze",
    icon: ScanLine,
    title: "Analisar vídeo",
    summary:
      "Envie um vídeo curto e veja cada repetição ou passada separada, com o que merece atenção em cada uma.",
    bullets: [
      "Detecção de repetições no agachamento, flexão e rosca direta",
      "Passadas contínuas no afundo livre e caminhando",
      "Esqueleto sobre o seu vídeo e linha do tempo por ciclo",
      "Cue prático e nível de confiança em cada observação",
    ],
    action: "Analisar meu movimento",
  },
  {
    surface: "exercises",
    icon: Library,
    title: "Exercícios",
    summary:
      "Uma biblioteca para aprender o movimento antes de treinar, organizada por músculo.",
    bullets: [
      "Vídeos reais de execução, sem animação genérica",
      "Três passos objetivos e o erro mais comum de cada exercício",
      "Busca por nome, músculo secundário ou equipamento",
      "Atalho direto para analisar o seu vídeo do movimento",
    ],
    action: "Abrir a biblioteca",
  },
  {
    surface: "routine",
    icon: CalendarDays,
    title: "Rotina",
    summary:
      "Um plano semanal montado no seu dispositivo, com regras claras de volume e descanso.",
    bullets: [
      "Rotina personalizada: o mesmo fluxo de sempre, sem pedir local nem equipamento",
      "Atalho 'Treine com o que você tem' para montar em menos de um minuto",
      "Nome de tratamento para o app falar com você neste navegador",
      "Check-in aos 60 dias para renovar ou subir o nível",
      "Opcional: mandar os treinos para o Google Agenda",
      "Fica salvo só no seu navegador, pronto na próxima visita",
    ],
    action: "Montar minha rotina",
  },
];

const STEPS = [
  {
    title: "Você escolhe o movimento",
    detail:
      "Cada exercício tem referências próprias de amplitude, alinhamento e ritmo, além do ângulo de câmera adequado.",
  },
  {
    title: "O vídeo fica no seu aparelho",
    detail: `Aceitamos MP4, MOV e WebM com até ${UPLOAD_LIMITS.maxSeconds} segundos e 250 MB. O arquivo não sobe para servidor nenhum.`,
  },
  {
    title: "A pose é mapeada frame a frame",
    detail: `O modelo de visão computacional roda no navegador e lê ${POSE_SAMPLING.fps} quadros por segundo, descartando trechos em que o corpo aparece pouco visível.`,
  },
  {
    title: "As repetições viram feedback",
    detail:
      "Os ângulos são suavizados, cada ciclo é separado e comparado com as referências do exercício. O que sai disso é uma observação com medida, cue e confiança.",
  },
];

const MEASURED: Record<string, string[]> = {
  squat: [
    `Profundidade: alerta quando o joelho não passa de ${FEEDBACK_THRESHOLDS.squat.shallowKneeAngle}°`,
    `Tronco: inclinação acima de ${FEEDBACK_THRESHOLDS.squat.torsoTiltLateral}° na câmera lateral`,
    "Joelhos: desvio em relação aos tornozelos na câmera frontal",
  ],
  pushup: [
    `Linha do corpo: desvio ombro–quadril–tornozelo acima de ${FEEDBACK_THRESHOLDS.pushup.bodyLineDeviation}°`,
    `Amplitude: cotovelo que não passa de ${FEEDBACK_THRESHOLDS.pushup.shortRangeElbowAngle}°`,
  ],
  curl: [
    `Cotovelos: avanço acima de ${FEEDBACK_THRESHOLDS.curl.elbowDriftDegrees}° da vertical do ombro`,
    `Flexão: menor ângulo acima de ${FEEDBACK_THRESHOLDS.curl.incompleteFlexionAngle}°`,
  ],
  lunge: [
    `Passada: joelho que não passa de ${FEEDBACK_THRESHOLDS.lunge.shallowKneeAngle}°`,
    `Tronco: inclinação acima de ${FEEDBACK_THRESHOLDS.lunge.torsoTilt}°`,
  ],
};

const FAQ = [
  {
    question: "Meu vídeo vai para algum servidor?",
    answer:
      "Não. O arquivo é lido pelo navegador com um endereço temporário local, processado ali mesmo e descartado. Só o resultado (ciclos, scores e recomendações) fica no banco do seu navegador, para você reabrir depois.",
  },
  {
    question: "Por que só quatro exercícios têm análise por vídeo?",
    answer:
      "Porque cada movimento precisa de referências próprias, validadas contra o que a câmera realmente consegue enxergar. Preferimos quatro movimentos com critérios claros a dezenas com palpite. Os demais exercícios estão na biblioteca com vídeo e instruções.",
  },
  {
    question: "O MOVIA identifica meu rosto?",
    answer:
      "Não. O modelo trabalha com pontos de articulação do corpo. Não há reconhecimento facial, identificação de pessoa nem qualquer cadastro biométrico.",
  },
  {
    question: "O que significa a confiança de cada observação?",
    answer:
      "Ela combina a qualidade da leitura naquele ciclo com a distância entre o valor medido e a referência. Confiança limitada quer dizer que a câmera viu pouco ou que o valor ficou na fronteira — trate como indício, não como veredito.",
  },
  {
    question: "Como o afundo caminhando é contado?",
    answer:
      "Como movimento contínuo. Cada passada é reconhecida por um vale proeminente na flexão do joelho, então você não precisa voltar ao ponto de partida nem parar entre uma passada e outra.",
  },
  {
    question: "Onde ficam minhas análises?",
    answer:
      "No IndexedDB do seu navegador, com cópia de segurança no armazenamento local. Elas sobrevivem a fechar a aba e voltar outro dia. Não vão para a Netlify nem para nenhum servidor. Limpar os dados do site ou trocar de aparelho apaga o histórico.",
  },
  {
    question: "O score serve para quê?",
    answer:
      "Para comparar suas próprias repetições dentro do mesmo vídeo e perceber onde a execução começou a mudar. Ele não é nota de aptidão nem comparação com outras pessoas.",
  },
  {
    question: "Por que a rotina pergunta o sexo?",
    answer:
      "Porque mulheres apresentam, em média, maior resistência à fadiga e recuperação mais rápida entre séries, o que sustenta descansos mais curtos e faixas de repetição um pouco maiores. O plano mostra exatamente o que mudou por causa disso. Sem essa informação, usamos a referência padrão — e vale lembrar que a variação entre pessoas do mesmo sexo é maior do que a diferença entre as médias.",
  },
  {
    question: "O que é “Treine com o que você tem”?",
    answer:
      "É um atalho rápido, separado da rotina personalizada. Você informa local, o que tem à mão e o tempo disponível. O Movia monta um treino executável com isso. A rotina personalizada não pede local nem equipamento e continua igual ao que já era.",
  },
  {
    question: "E se eu não tiver nenhum equipamento?",
    answer:
      "No atalho rápido o treino sai só com peso corporal. Se você não souber o que tem, o Movia assume nenhum equipamento — o cenário mais restritivo — para o treino ser sempre possível de fazer. Dá para trocar um exercício por outro do mesmo grupo, desde que caiba no que você tem.",
  },
  {
    question: "O Movia pede meu nome e login Google?",
    answer:
      "O nome de tratamento fica neste navegador, para o app falar com você — pode ser apelido, e dá para pular. O login Google é opcional e só aparece se você quiser mandar a rotina para a Agenda. Aí o Google pede permissão para criar eventos. O token não é guardado no aparelho. O vídeo da análise continua no seu aparelho e não vai para a conta Google.",
  },
  {
    question: "Como a rotina vai para o Google Agenda?",
    answer:
      "Na tela da Rotina, depois de gerar o plano, você escolhe o horário e toca em Continuar com o Google. O Movia cria um evento por dia de treino, repetindo por oito semanas. Sem isso, a Rotina oferece um aviso neste aparelho no mesmo horário — o aviso chega se o site estiver aberto.",
  },
  {
    question: "O que acontece depois de dois meses de rotina?",
    answer:
      "O Movia pergunta se o treino está fácil, adequado ou pesado. Você pode renovar no mesmo nível, subir (iniciante, intermediário, avançado) ou dizer agora não — o convite volta em cerca de 60 dias. Se estiver pesado, o app não sugere subir. As séries que você marcou na semana entram nesse convite. Não é avaliação de saúde: é só um convite para ajustar o plano.",
  },
];

export function AboutSurface({ catalog, onNavigate }: AboutSurfaceProps) {
  const analyzableCount = catalog.filter((item) => item.analyzable).length;
  const groupCount = new Set(catalog.map((item) => item.muscleGroup)).size;

  const numbers = [
    { value: catalog.length, label: "Exercícios com vídeo real" },
    { value: groupCount, label: "Grupos musculares" },
    { value: analyzableCount, label: "Movimentos analisados" },
    { value: `${POSE_SAMPLING.fps}/s`, label: "Quadros lidos por segundo" },
    { value: 0, label: "Vídeos enviados para servidor" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 sm:px-6 lg:px-10">
      <section className="grid gap-10 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-16">
        <div className="space-y-6">
          <Eyebrow>Sobre o MOVIA</Eyebrow>
          <h1 className="display-xl max-w-2xl">
            Treinar bem começa por
            <br />
            <span className="text-vivid">enxergar o movimento.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">
            A maior parte das pessoas treina sem nunca se ver treinando. O MOVIA
            existe para fechar essa distância: você grava um vídeo curto, ele
            mostra o que está acontecendo no seu corpo e devolve uma orientação
            que dá para aplicar na série seguinte.
          </p>
          <p className="max-w-xl text-base leading-relaxed text-muted">
            A entrada apresenta a marca e pergunta como você quer ser chamado.
            Depois, você escolhe a rotina de sempre ou o atalho “Treine com o
            que você tem”. Em dois meses o plano volta a conversar. Se quiser,
            o Google Agenda recebe os treinos. Sem julgamento, sem promessa de
            correção perfeita e sem enviar o seu vídeo para lugar nenhum.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="vivid">
              <Cpu className="size-3.5" aria-hidden />
              Processado no dispositivo
            </Badge>
            <Badge tone="neutral">
              <EyeOff className="size-3.5" aria-hidden />
              Sem reconhecimento facial
            </Badge>
            <Badge tone="neutral">
              <ShieldCheck className="size-3.5" aria-hidden />
              Análise visual responsável
            </Badge>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigate("analyze")}
              className={buttonClasses("primary")}
            >
              <ScanLine className="size-4" aria-hidden />
              Começar uma análise
            </button>
            <button
              type="button"
              onClick={() => onNavigate("exercises")}
              className={buttonClasses("secondary")}
            >
              Conhecer a biblioteca
            </button>
          </div>
        </div>

        <div className="card-base relative overflow-hidden p-7 sm:p-9">
          <div className="movia-lines absolute inset-0 opacity-60" />
          <div className="absolute -top-16 -right-12 size-48 rounded-full bg-vivid/15 blur-2xl" />
          <div className="relative space-y-5">
            <Eyebrow>O princípio</Eyebrow>
            <p className="text-2xl leading-tight font-[820] tracking-tight">
              Uma estimativa honesta vale mais do que um diagnóstico bonito.
            </p>
            <ul className="space-y-3 text-sm leading-relaxed text-muted">
              {[
                "Toda observação vem com o número que a gerou.",
                "Toda observação vem com o nível de confiança.",
                "Quando a câmera vê pouco, o app diz que viu pouco.",
                "Quando o movimento está consistente, o app também diz.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-vivid" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-label="Números do produto" className="py-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {numbers.map((item) => (
            <div key={item.label} className="card-base p-5">
              <dd className="text-4xl leading-none font-[850] tracking-tighter">
                {item.value}
              </dd>
              <dt className="mt-2 text-xs leading-snug font-semibold text-muted">
                {item.label}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="o-que-da-para-fazer" className="pt-16">
        <div className="space-y-3">
          <Eyebrow>O que dá para fazer aqui</Eyebrow>
          <h2 id="o-que-da-para-fazer" className="display-lg max-w-2xl">
            Três superfícies, um só objetivo.
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted">
            Aprender o movimento, organizar a semana e conferir a execução. Você
            circula livremente entre elas pelo menu do topo.
          </p>
        </div>

        <ul className="mt-8 grid gap-4 lg:grid-cols-3">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <li key={pillar.surface} className="card-base flex flex-col p-6">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-vivid/12 text-deep">
                  <Icon className="size-5" />
                </span>
                <p className="mt-4 text-xl font-[830] tracking-tight">
                  {pillar.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {pillar.summary}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {pillar.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2.5">
                      <ListChecks
                        className="mt-0.5 size-4 shrink-0 text-deep"
                        aria-hidden
                      />
                      <span className="text-sm leading-relaxed text-muted">
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => onNavigate(pillar.surface)}
                  className={buttonClasses("secondary", "mt-6 w-full")}
                >
                  {pillar.action}
                  <ArrowRight className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="com-o-que-voce-tem" className="pt-16">
        <div className="space-y-3">
          <Eyebrow>Novo atalho</Eyebrow>
          <h2 id="com-o-que-voce-tem" className="display-lg max-w-2xl">
            Treine com o que você tem.
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted">
            A rotina personalizada não mudou. Este caminho é extra: para quem
            quer um treino agora, com o espaço e o material que existem — ou
            sem material nenhum.
          </p>
        </div>

        <ul className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            {
              icon: Home,
              title: "Onde você está",
              detail:
                "Casa, ao ar livre ou outro espaço. O treino só usa movimentos que cabem nesse lugar.",
            },
            {
              icon: Sparkles,
              title: "O que você tem à mão",
              detail:
                "Nenhum, o básico ou o que estiver disponível. Se não souber, o Movia assume nenhum — o treino continua executável.",
            },
            {
              icon: ListChecks,
              title: "Trocar exercício",
              detail:
                "Cada movimento tem alternativas do mesmo grupo muscular, filtradas pelo que você marcou. Sem palpite.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className="card-base p-6">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-vivid/12 text-deep">
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="mt-4 text-xl font-[830] tracking-tight">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.detail}
                </p>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => onNavigate("routine")}
          className={buttonClasses("primary", "mt-8")}
        >
          <Sparkles className="size-4" aria-hidden />
          Ir para o planejador
        </button>
      </section>

      <section aria-labelledby="acompanha-no-tempo" className="pt-16">
        <div className="space-y-3">
          <Eyebrow>Acompanha no tempo</Eyebrow>
          <h2 id="acompanha-no-tempo" className="display-lg max-w-2xl">
            Nome, evolução e agenda.
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted">
            O Movia não some depois de montar a semana. Ele fala com você, volta
            em dois meses para ajustar o nível e, se você autorizar, coloca os
            treinos no Google Agenda.
          </p>
        </div>

        <ul className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            {
              icon: UserRound,
              title: "Nome de tratamento",
              detail:
                "Perguntamos como você quer ser chamado — pode ser apelido. Isso muda o tom na entrada, no menu e na rotina. Fica só neste navegador. Pode pular.",
            },
            {
              icon: TrendingUp,
              title: "Evolução aos 60 dias",
              detail:
                "Depois de cerca de dois meses, o app pergunta se o treino está fácil, adequado ou pesado. Você pode renovar no mesmo nível, subir (iniciante → intermediário → avançado) ou deixar para depois. Não é avaliação de saúde.",
            },
            {
              icon: CalendarDays,
              title: "Google Agenda",
              detail:
                "Opcional. Você escolhe o horário, entra com o Google, autoriza criar eventos e o Movia manda os treinos por oito semanas. Sem arquivo .ics. O vídeo da análise não vai para a conta Google.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className="card-base p-6">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-vivid/12 text-deep">
                  <Icon className="size-5" />
                </span>
                <p className="mt-4 text-xl font-[830] tracking-tight">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.detail}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="como-funciona" className="pt-16">
        <div className="space-y-3">
          <Eyebrow>Como a análise funciona</Eyebrow>
          <h2 id="como-funciona" className="display-lg max-w-2xl">
            Do vídeo à recomendação, sem mistério.
          </h2>
        </div>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card-base relative p-6">
              <span className="text-5xl leading-none font-[850] tracking-tighter text-vivid/25">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-3 text-base font-[820] tracking-tight">
                {step.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="o-que-medimos" className="pt-16">
        <div className="space-y-3">
          <Eyebrow>O que o MOVIA observa</Eyebrow>
          <h2 id="o-que-medimos" className="display-lg max-w-2xl">
            Referências abertas, movimento por movimento.
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted">
            Estes são os mesmos valores usados pelo motor de análise. Eles são
            pontos de referência visual, não uma regra sobre o corpo de todo
            mundo.
          </p>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {ANALYSIS_PROFILES.map((profile) => (
            <li key={profile.id} className="card-base p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-night text-sm font-[830] text-lime">
                  {profile.code}
                </span>
                <div>
                  <p className="text-base font-[820] tracking-tight">
                    {profile.name}
                  </p>
                  <p className="text-xs text-muted">
                    {profile.continuous
                      ? "Passadas contínuas"
                      : "Repetições com retorno ao topo"}
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2.5">
                {MEASURED[profile.id].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Gauge
                      className="mt-0.5 size-4 shrink-0 text-deep"
                      aria-hidden
                    />
                    <span className="text-sm leading-relaxed text-muted">
                      {item}
                    </span>
                  </li>
                ))}
                <li className="flex gap-2.5">
                  <Timer
                    className="mt-0.5 size-4 shrink-0 text-deep"
                    aria-hidden
                  />
                  <span className="text-sm leading-relaxed text-muted">
                    Ritmo: ciclo abaixo de {profile.fastTempoSeconds} s indica
                    execução acelerada
                  </span>
                </li>
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="privacidade"
        className="mt-16 overflow-hidden rounded-[24px] border border-night bg-night text-surface"
      >
        <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_1fr]">
          <div className="movia-lines absolute inset-0 opacity-40" />
          <div className="relative space-y-4">
            <p className="text-[0.72rem] font-bold tracking-[0.22em] text-lime uppercase">
              Privacidade por arquitetura
            </p>
            <h2 id="privacidade" className="display-md text-surface">
              Seu vídeo nunca sai do seu aparelho.
            </h2>
            <p className="text-sm leading-relaxed text-surface/70">
              Não é uma promessa de política de uso: é como o produto foi
              construído. O modelo de visão computacional é baixado uma vez e
              roda dentro do navegador, então não existe upload para processar.
            </p>
          </div>

          <ul className="relative grid gap-3 sm:grid-cols-2">
            {[
              { icon: Lock, text: "Nenhum vídeo enviado ou armazenado" },
              { icon: EyeOff, text: "Sem reconhecimento facial" },
              { icon: Cpu, text: "Pose calculada no navegador" },
              { icon: ShieldCheck, text: "Nome e rotina ficam neste navegador" },
              {
                icon: CalendarDays,
                text: "Google só entra se você mandar a rotina para a Agenda",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.text}
                  className="rounded-2xl border border-surface/12 bg-surface/6 p-4"
                >
                  <Icon className="size-4 text-vivid" aria-hidden />
                  <p className="mt-2.5 text-sm leading-snug font-semibold">
                    {item.text}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section aria-labelledby="limites" className="pt-16">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-3">
            <Eyebrow>Limites</Eyebrow>
            <h2 id="limites" className="display-lg text-balance">
              O que o MOVIA não é.
            </h2>
            <p className="text-base leading-relaxed text-muted">
              Deixar isso claro faz parte do produto. Uma ferramenta que conhece
              os próprios limites é mais útil do que uma que promete tudo.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Não é diagnóstico",
                detail:
                  "Nada aqui identifica lesão, condição clínica ou risco. É leitura visual de movimento.",
              },
              {
                title: "Não substitui profissional",
                detail:
                  "Dor, desconforto persistente, gestação ou limitação de movimento pedem avaliação presencial.",
              },
              {
                title: "Não mede carga nem esforço",
                detail:
                  "A câmera enxerga geometria, não a intensidade do que você está levantando.",
              },
              {
                title: "Histórico só neste navegador",
                detail:
                  "Resultados ficam no banco local do aparelho. Trocar de browser, limpar dados do site ou usar outro celular começa do zero.",
              },
              {
                title: "O check-in não avalia saúde",
                detail:
                  "Perguntar se o treino está fácil ou pesado serve só para renovar o plano. Dor ou preocupação pedem um profissional.",
              },
            ].map((item) => (
              <li key={item.title} className="card-base p-5">
                <div className="flex items-start gap-2.5">
                  <TriangleAlert
                    className="mt-0.5 size-4 shrink-0 text-[#8A5A12]"
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-[820] tracking-tight">
                      {item.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="perguntas" className="pt-16">
        <div className="space-y-3">
          <Eyebrow>Perguntas frequentes</Eyebrow>
          <h2 id="perguntas" className="display-lg max-w-2xl">
            O que costumam perguntar.
          </h2>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          {FAQ.map((item) => (
            <details
              key={item.question}
              className="card-base group px-5 py-4 open:border-vivid/50"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.95rem] font-[800] tracking-tight">
                {item.question}
                <span
                  aria-hidden
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-muted transition",
                    "group-open:rotate-45 group-open:border-vivid group-open:text-deep",
                  )}
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="card-base mt-16 flex flex-col items-start gap-5 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-deep" aria-hidden />
            <p className="eyebrow">Pronto para começar</p>
          </div>
          <p className="display-md max-w-lg">
            Grave três repetições e veja o que muda.
          </p>
          <p className="max-w-lg text-sm leading-relaxed text-muted">
            Se preferir, comece pela análise de demonstração e depois envie o seu
            vídeo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("analyze")}
          className={buttonClasses("primary", "shrink-0")}
        >
          <ScanLine className="size-4" aria-hidden />
          Ir para a análise
        </button>
      </section>
    </div>
  );
}
