# MOVIA — Seu movimento. Mais consciente.

Coach visual de treino que roda no navegador. Você envia um vídeo curto, o app
mapeia a pose frame a frame **no próprio dispositivo**, identifica cada repetição
ou passada, aponta o que merece atenção com incerteza declarada e mostra uma
execução de referência em vídeo real.

O mesmo produto reúne quatro superfícies:

| Superfície         | O que faz                                                                 |
| ------------------ | ------------------------------------------------------------------------- |
| **Exercícios**     | Biblioteca com dezenas de exercícios reais em 9 grupos musculares, cada um com vídeo, busca e filtros |
| **Rotina**         | Planejador semanal, nome de tratamento, check-in aos 60 dias e envio opcional ao Google Agenda |
| **Analisar vídeo** | Upload local, detecção de repetições/passadas e feedback com cues          |
| **Sobre**          | Propósito, método, privacidade, evolução do treino e limites               |

## Como rodar localmente

Requisitos: Node.js 20+ (testado no 24) e npm.

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>.

O `predev` copia o runtime WebAssembly do MediaPipe para `public/mediapipe/wasm`
e baixa o modelo `pose_landmarker_lite` para `public/mediapipe/models`. Se o
download falhar (máquina offline no primeiro setup), o app usa a URL pública do
MediaPipe como fallback — nada além do modelo trafega pela rede.

## Verificação

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint (zero warnings)
npm run test        # Vitest: SSR, catálogo, vídeos, planejador, detecção
npm run test:e2e    # Playwright: fluxo real em desktop e mobile
npm run build       # build de produção
npm run check       # typecheck + lint + test + build
```

A suíte de navegador cobre navegação entre as superfícies, conteúdo e atalhos da
superfície Sobre, busca e modal da
biblioteca, geração/persistência/reorganização da rotina, recusa de arquivo
inválido, análise de demonstração com vídeo de referência, ausência de rolagem
horizontal, carga real do `PoseLandmarker` (GPU com fallback para CPU) e o
pipeline completo de upload com um WebM gravado no próprio navegador.

## Publicação

O projeto é um app Next.js padrão e sobe em qualquer plataforma serverless
compatível.

```bash
npm run build
npm run start        # execução local do bundle de produção
```

Na [Netlify](https://app.netlify.com/) importe o repositório GitHub
`Ewertonalex/Movia`. O `netlify.toml` já define o build Next.js e pula o SQLite
nativo — o disco da Netlify é efêmero, então o catálogo usa a cópia embutida e
as análises ficam no IndexedDB do navegador de cada pessoa.

Dois pontos de atenção:

- `better-sqlite3` só entra se `MOVIA_USE_SQLITE=1` (uso local). Na Netlify o
  app usa o catálogo embutido — o disco do servidor some entre deploys.
- Os arquivos de `public/mediapipe` são gerados no build e ficam fora do Git.
- Para o login Google + Agenda, defina `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (cliente
  OAuth **Web**, origens autorizadas do site, API Calendar ligada). Sem essa
  chave o botão da agenda explica a configuração e não tenta autenticar.

## Arquitetura

```
src/
  app/                 layout, estilos globais e página (server component)
  components/
    analyze/           coach de vídeo: hero, upload, progresso, resultados
    library/           biblioteca de exercícios e modal de detalhes
    planner/           planejador semanal
    ui/                primitivas visuais e toast
  lib/
    analysis/          geometria, métricas, detecção de ciclos, regras, pose
    planner/           geração do plano e persistência local
    analysis/          geometria, métricas, ciclos, regras, pose e histórico
    db/                Drizzle + SQLite com reconciliação do catálogo
    catalog.ts         catálogo embutido (23 da rotina clássica + extras da biblioteca)
tests/                 Vitest
e2e/                   Playwright
```

### Dados e fallback

O catálogo vive em `src/lib/catalog.ts`. Quando o SQLite está disponível, o app
faz seed do banco na primeira execução e passa a ler de lá. Vídeo, perfil de
análise, ângulo de câmera e ordem sempre vêm do catálogo embutido, mesmo quando
o banco tem linhas antigas — assim uma correção em código nunca é anulada por
dado desatualizado.

### Análise de movimento

- `@mediapipe/tasks-vision` com `PoseLandmarker` em `runningMode: VIDEO`,
  amostragem a 10 fps, GPU com fallback para CPU.
- Frames abaixo de 0,32 de visibilidade média são descartados; a análise exige
  ao menos `max(12, 35%)` dos frames amostrados.
- Séries suavizadas com média móvel de raio 2.
- Agachamento, flexão e rosca usam máquina de estados com histerese.
- Afundo caminhando é tratado como movimento contínuo: as passadas saem de vales
  proeminentes na flexão do joelho, sem exigir retorno à posição neutra.
- Score por ciclo: `clamp(round(96 − 11 × alertas), 58, 98)`; a consistência é a
  média dos scores.

### Privacidade

Vídeo e pontos de pose não saem do navegador. Não há reconhecimento facial e o
arquivo de vídeo não é persistido. O plano semanal fica em `localStorage`
(`movia-weekly-plan-v1`) e cada análise concluída vai para o IndexedDB
(`movia-history`), com cópia no `localStorage` (`movia-analyses-v1`) se o banco
do navegador estiver indisponível. A chave legada `form-weekly-plan-v1` ainda é
lida, para não perder planos de versões anteriores.

## Limitações reais

- A análise por vídeo cobre quatro movimentos: agachamento, flexão de braço,
  rosca direta e afundo livre/caminhando.
- Estimativas visuais têm margem de erro. Roupas largas, pouca luz, câmera
  instável ou enquadramento parcial degradam a leitura, e o app avisa quando não
  enxerga o corpo o suficiente.
- Não há conta de usuário. Histórico de análises e rotina ficam no navegador
  de quem usa o app; limpar os dados do site ou trocar de aparelho apaga o
  que estava salvo.
- Os vídeos de referência abrem no YouTube em nova aba. Nenhum player é
  incorporado, porque embeds costumam ser bloqueados.
- O resultado é visual, não diagnóstico. Dor, lesão, gestação ou condição
  clínica pedem orientação de um profissional qualificado.
