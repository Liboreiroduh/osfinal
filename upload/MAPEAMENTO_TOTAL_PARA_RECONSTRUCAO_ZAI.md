# MAPEAMENTO TOTAL DO SISTEMA - PREPARAÇÃO PARA RECONSTRUÇÃO NO Z.AI

# BLOCO 1 — VISÃO GERAL DO SISTEMA
- **Nome Aparente:** projops-ledcollor / "ledcollor Field Ops"
- **Objetivo do Produto:** Sistema de Field Operations (Operações de Campo) voltado à instalação e manutenção de painéis de LED. O sistema centraliza Ordens de Serviço (OS), relatórios fotográficos, checklists de controle de qualidade, e gestão da frota de veículos (vistorias e manutenções).
- **Público Usuário:** Administradores/Gestores no back-office e Técnicos/Instaladores trabalhando em campo.
- **Perfis de Usuário:** 
  - `MANAGER`: Gerente do sistema, com acesso total de visualização a dashboard, calendário e permissão de criação/atribuição de Ordens de Serviço.
  - `INSTALLER`: Técnico responsável por executar a OS, apontar horas, realizar checklists e vistorias de veículos.
  - Há também um nível de `Permission` cruzado com o `Role` (`ADMIN`, `EDITOR`, `VIEWER`), determinando as ações de CRUD possíveis (ex: excluir um usuário, visualizar as telas de configurações e equipe).
- **Stack Usada Hoje:** React 19 (SPA puramente frontend), TypeScript, TailwindCSS v4, Recharts, Lucide-React e Vite.
- **Arquitetura Aparente:** Single Page Application conectada de forma severless a um backend-as-a-service (Firebase). O projeto implementa um "Gateway de Dados" (`dataGateway.ts`) que abstrai o armazenamento, permitindo chavear via `.env` entre o Modo Local (`localStorage`) e o Modo Firebase Real.
- **Modo Local vs Firebase:** Existe um comportamento altamente acoplado a uma variável de ambiente `VITE_APP_MODE`. Quando `'LOCAL'`, o sistema mascara chamadas ao Firebase e usa o `mockStore.ts` salvando no `localStorage` (com a key `led_local_db_v1`). Esse modo possui dropdown simulando login na tela inicial. Quando `'FIREBASE'`, exige login com Google e leitura real do Cloud Firestore e Firebase Storage.
- **Dependências Centrais:** Firebase (Auth, Firestore, Storage), `@google/genai` (para OCR de despesas via Gemini), `recharts` (para gráficos).

---

# BLOCO 2 — MAPA DE TELAS / PÁGINAS / VIEWS

### 1. Login / Entrada (`App.tsx`)
- **Rota/Acesso:** Raiz `/` (renderizado se não houver usuário autenticado no App).
- **Como chega:** Abertura da aplicação base.
- **O que faz:** Autenticação via Google Auth (ou mock/dropdown se modo LOCAL for detectado). Intercepta erros de popup e recusa de permissão da collection `users`. Impede o avanço caso o e-mail não esteja pré-cadastrado no banco (lista de convidados), mas cria um 1º usuário ADMIN magicamente se a coleção estiver explicitamente vazia. Se a autenticação falhar retorna erro visual.

### 2. Dashboard (`views/Dashboard.tsx`)
- **Quem pode acessar:** `MANAGER`. (Técnicos veem um empty state bloqueado).
- **O que faz:** Visão gerencial sobre os serviços do mês e ocupação.
- **Componentes:** Gráfico de OS por estado, Gráfico de OS por Técnico atuante (com filtro dinâmico de status e nome), cards superiores de totalizações.
- **Destaque:** Calcula "M² Instalados no Mês" (somando larguraxaltura de OS finalizadas no mês corrente). Lista compacta de veículos em rota na parte inferior.

### 3. Calendário (`views/Calendar.tsx`)
- **Quem pode acessar:** `MANAGER`.
- **O que faz:** Uma visualização mensal (grid) contendo as OS agendadas. Ao clicar num dia vazio (Manager não Viewer), abre modal de Nova OS.
- **Integração Exclusiva:** Busca de endereço via BrasilAPI através do CEP. Automação com Google Calendar API para agendar o serviço também na agenda do técnico/empresa e associar um `eventId`.

### 4. Ordens de Serviço / Tabela (`views/WorkOrders.tsx`)
- **Quem pode acessar:** `MANAGER` (Vê tudo) / `INSTALLER` (Vê apenas as suas atribuídas).
- **O que faz:** Listagem Kanban (Pendentes, Execução, Concluídas) ou Listagem Simples via toggle no topo.
- **Filtros Adicionais:** Botões rápidos de status na barra de comandos.

### 5. Detalhe e Execução de OS (`views/WorkOrders.tsx` - componente interno OrderDetail)
- **Como chega:** Clique num card de OS na listagem.
- **O que faz:** A "alma" técnica do sistema. Exibe as informações da OS que são readonly para o técnico, mas editáveis pelo Manager (via um botão minúsculo de edição de caneta).
- **Ações:**
  - Start/Pause/Resume Tracker (GPS track no clique usando Geolocation API).
  - Preenchimento do Checklist Técnico (Abas de estrutura, elétrica, rede, etc.).
  - Upload Fotográfico "Antes, Durante, Depois".
  - Inserção de Peças.
  - Inserção de Despesas.
  - Assinaturas (Canvas).
  - Preview de impressão (modo `CLIENT` ou `FINANCIAL`).
  - Geração de MailTo com resumo.

### 6. Frota (`views/Fleet.tsx`)
- **Quem pode acessar:** `MANAGER` e `INSTALLER`. (INSTALLER pode retirar, MANAGER gerencia/exclui).
- **O que faz:** Visão do pátio de veículos. Se o carro estiver "Disponível", pode iniciar Vistoria de Saída. Se estiver "Em uso", a devolução fica habilitada. Managers possuem um botão de Enviar para Manutenção (+ modal com custo/foto).
- **Estados Visuais do Veículo:** Available (Verde), In Use (Azul), Maintenance (Vermelho).
- **Histórico:** Cada veículo tem um modal que carrega o LOG no formato timeline vertical das saídas e devoluções.

### 7. Despesas e Reembolsos (`views/Expenses.tsx`)
- **Quem pode acessar:** `MANAGER` e `INSTALLER` (para lançar avulsas, não vinculadas à OS especificamente).
- **O que faz:** Adição explícita de despesas administrativas da equipe. Possui OCR rodando no provedor `@google/genai` (função `analyzeReceipt` do `geminiService.ts`) que auto-preenche a data, comerciante, valor monetário e categoria, detectados se subir a foto da nota.

---

# BLOCO 3 — INVENTÁRIO COMPLETO DE PROPRIEDADES

**1. Propriedades de Usuário (`User`)**
- `id` (string, PK)
- `name` (string)
- `email` (string)
- `avatar` (string, URL ou UI Avatar gerado, optional)
- `role` (`MANAGER` | `INSTALLER`)
- `permission` (`ADMIN` | `EDITOR` | `VIEWER`)

**2. Propriedades de OS / WorkOrder (`WorkOrder`)**
- `id` (string)
- `osNumber` (string, PK visual)
- `type` (`ServiceType` enum: Instalação, Preventiva, Corretiva, RMA, etc)
- `title` (string)
- `client` (string)
- `clientContact` (Objeto: `name`, `phone`, `email?`)
- `address` (string, Endereço Livre legade)
- `structuredAddress` (Objeto Estruturado Novo: `state`, `city`, `addressLine1`, `addressLine2`, `district`, `zipCode`, `reference` — optativos)
- `description` (string)
- `status` (`WorkOrderStatus`: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`)
- `assignedToUserId` (string, ID relacionando User)
- `assignedToName` (string)
- `assignedToEmail` (string)
- `assignedTo` (string legado de nome livre)
- `date` (string, formato Data ISO / YYYY-MM-DD)
- `requiresEPI` (boolean, flag de EPI nova)
- `timeLogs` (Array de `TimeLogEntry`: `type`, `timestamp`, `location`, `reason`)
- `totalTime` (number, em segundos acumulados)
- `productDetails` (Objeto: `type` (IN/OUT), `pixelPitch`, `width`, `height`, `cabinetCount?`, `reportedProblem?`)
- `parts` (Array de itens solicitados)
- `expenses` (Array de despesas)
- `technicalReport` (string, pós execução)
- `moduleBatch` (string)
- `executionLocation` (string formatada com GPS)
- `googleCalendarEventId` (string)
- `photosBefore`, `photosDuring`, `photosAfter` (Array string)
- `videosBefore`, `videosDuring`, `videosAfter` (Array string)

**3. Propriedades de Checklist de Instalação (`InstallationChecklist`)**
- `structure`: `{conform: bool, photo?: string}`
- `power`: `{conform: bool, photo?: string, voltage?: string}`
- `data`: `{conform: bool, photo?: string}`
- `epi`: `{photo?: string}` (condicional)
- `processing`: `{device: string, serial: string, quantity: number, photo: string}`
- `cabinet`: `{type: 'GABINETE'|'MODULO', pixelPitch: string, batch: string, quantity: number, photo: string}` (e os campos de fallback `resolution`)
- `peripherals`: `{photo?: string, structuredItems: [{item: 'CABO_AC'...'COMPUTADOR', quantity}], items?: string legado}`
- `missingItems`: `{hasMissing: bool, description: string}`

**4. Propriedades do Completion (Relatório Final Admin - `CompletionData`)**
- `materialSealed`, `materialVerified`, `damageSuspected`, `structureCondition` (Booleans e Strings)
- `installationPerfect`, `cablesOrganized`, `powerStable`, `powerBoardCondition`, `voltageMeasured`
- `processorModel`, `computerInstalled`, `mappingSolidified`, `brightnessAdjusted`, `redundancyConfigured`, `redundancyJustification`
- `trainingGiven`, `traineeName`, `remoteAccess`
- `defectiveModules`, `defectiveCount`, `defectiveDestination`
- `backupKitDelivered`, `backupKitContent`, `spareFilesCreated`, `sparePartsPhotos`
- `powerOrientations`, `processorOrientations`
- `supervisorName`

**5. Propriedades de Frota / Veículo (`Vehicle`)**
- `id`, `model`, `plate`, `status` (`AVAILABLE`, `IN_USE`, `MAINTENANCE`)
- `currentDriver` (string)
- `lastOdometer`, `nextMaintenanceOdometer` (number)
- `notes` (string, editada em modo UI in-place)

**6. Propriedades de Vistorias de Veículo (`VehicleCheck`)**
- `id`, `vehicleId`, `userId`, `userName`
- `type` (`CHECK_OUT`, `CHECK_IN`, `MAINTENANCE`)
- `timestamp` (number, ms)
- `odometer` (number)
- `fuelLevel` (number 0 a 100)
- `destination`, `reason` (string, destination exigido pra saída, reason pra pausas ou checkin c/ danos)
- `photos` (Array string)
- `video` (string media externa URL)
- `checklist` (Bool obj: `tires`, `mirrors`, `lights`, `fluids`, `brakes`)
- `checklistSignature` (boolean li e aceito liability)
- `cost`, `provider`, `budgetPhoto`, `maintenanceDate` (Props de Manutenção)

**7. App Settings (`AppSettings` / `NotificationPreferences`)**
- `financeEmail` (string, global configs destino do impressao)
- `newAssignments`, `statusUpdates`, `deadlines` (boolean, preferences locais)


---

# BLOCO 4 — INVENTÁRIO COMPLETO DE TEXTOS VISÍVEIS

*Devido à grande quantidade, um compilado dos textos centrais com impacto funcional:*

**Módulos Fixos (Sidebar):**
- "Dashboard"
- "Calendário"
- "Ordens de Serviço"
- "Frota"
- "Equipe" (Apenas Admins)
- "Sair" (Ações dropdown de conta)

**Botões Fundamentais:**
- "Entrar com Google" | "Entrar no modo local"
- "Nova OS" (icone de + no calendário)
- "Retirar" (Frota)
- "Devolver" (Frota)
- "Concluir Manutenção" (Frota)
- "Agendar Manutenção"
- "Iniciar" (Tracker)
- "Pausar Serviço" (Pausa exigindo justiticativa)
- "Retomar" (Tracker)
- "Finalizar OS" -> "Avançar para Assinatura" -> "Confirmar e Finalizar"
- "Buscar CEP" (Brasil API)
- "Imprimir Cliente", "Imprimir Financeiro"

**Labels e Cabeçalhos:**
- "Área Instalada (Mês)", "Frota em Rota", "Concluídas", "Pendentes".
- "Dados da OS (Base Administrativa)"
- "Conferência Técnica de Instalação" (Etapas: "1. Estrutura", "2. Alimentação Elétrica"... etc).
- "Avaria Pré-existente (se houver)"
- "Relatório Técnico", "Local de Execução".
- "Acesso Restrito", "Firebase preservado..." (Texto na tela de login modo local).

**Empty States e Avisos:**
- "Nenhum dado encontrado com os filtros atuais." (Dashboard de Rankings).
- "Nenhuma OS encontrada com este filtro." (Listagem de OS).
- "Acesse Ordens de Serviço para começar." (Dashboard vazio para o Técnico).
- "* É obrigatório enviar pelo menos uma foto/vídeo para cada etapa..."
- "Dados administrativos são herdados da criação da OS e ficam bloqueados para edição no fluxo técnico."

---

# BLOCO 5 — FLUXOS DO SISTEMA

**1. Fluxo de Agendamento (Novo Serviço)**
- **Entrada:** `MANAGER` clica no botão "+" num card de dia no `Calendar.tsx`.
- **Passos:** Preenche formulário; Se inserir CEP clica em "Buscar CEP" preenchendo o endereço estruturado. Associa um Técnico ao formulário. Opcionalmente (se Auth Google estiver vivo e a Switch ativada), ele agenda também no `Google Calendar`.
- **Saída:** A OS nasce com Status `PENDING` e o técnico receberá a notificação que há um novo serviço no app dele.

**2. Fluxo de Execução Técnica (A OS em Campo)**
- **Entrada:** `INSTALLER` acessa `WorkOrders.tsx` e clica numa OS que foi assinalada a ele e está Pending.
- **Passos:** 
  a. Clica em "Iniciar" (Tracker pega o GPS instantâneo e inicia o relógio local e os cronômetros `elapsed`).
  b. Clica fotográficas obrigatórias do "Antes".
  c. Realiza os passos 1 a 8 preenchendo o Checklist Técnico (estrutura, energia, módulos, EPI se exigido).
  d. Tira fotos da etapa "Durante" ou grava vídeos de acompanhamento.
  e. Realiza fotos do "Depois".
  f. Pode Inserir Peças gastas (nome e qtd). O botão do modal insere na lista interna.
  g. Assinatura do instalador via canvas PAD. Assinatura do cliente via canvas PAD finalizando o aceite do serviço.
- **Pausa Crítica:** Se pausar, o sistema exige uma String ("motivo_pausa") e registra novo bloco no array de `timeLogs` interceptando o GPS de novo.
- **Saída:** OS evolui para `COMPLETED`. 

**3. Fluxo de Custeio IA / Despesas**
- **Entrada:** Usuário em tela de Despesas avulsas ou internamente na OS na aba "Despesas" abre o modal de subir nota/recibo fiscal.
- **Passos:** Usuario ativa câmera para nota. Front-end converte imagem p/ DataURL (Base64). Sistema envia ao Gemini (`geminiService.ts`). IA OCR lê a imagem e mapeia o fornecedor, a data, o total fiscal, inferindo categoria. Campos são pré-preenchidos em 3 segs com banner ("Analisando com IA..."). Usuário confirma.
- **Saída:** Despesa adicionada com Imagem, valor e `merchant` populados.

**4. Fluxo de Vistoria de Frota (Check-out)**
- **Entrada:** Veículo verde (disponível). Motorista clica "Retirar" na aba Frota.
- **Passos:** Informa KM nova. Confere Gasolina num Slider Visual Gauge interativo. Tira obrigatoriamente 1 foto do painel do veículo demonstrando KM real. Preenche Checklist boolean (Pneus, Frenagem, Luzes, Óleo, Fluidos). Obrigatoriamente grava 1 Vídeo com a câmera do celular dando volta na lataria (Vídeo 360). Informa o "Destino" da viagem. Assina aceite de termo de posse ("Declaro..."). Clica Finalizar.
- **Saída:** Carro fica Azul (IN USE). Veículo registra novo item no array `vehicle_history` vinculado com UID do motorista.

---

# BLOCO 6 — REGRAS DE NEGÓCIO

1. **Visibilidade das OS Limitada:** Usuários técnicos SÓ VÊEM as OS onde quer que o `assignedToUserId` (ou legado `assignedToEmail`) seja igual as chaves deles (Rule `isAssignedInstaller()` no firestore e filtro front-end no `visibleOrders`). Gerentes enxergam *TODAS*.
2. **GPS Estrito:** Sem consentimento de location GPS no browser mobile do técnico, o sistema *bloqueia hard* que ele inicie, pause ou conclua uma OS. O front-end tem 2 tentativas de GPS (`enableHighAccuracy`, depois timeout fallback pra precisão de rede wifi. Se ambos falharem, exibe UI Error e barra).
3. **Trava de Finalização (canFinish):** O botão de "Avançar para Assinatura/Finalizar" do Technical Report não acende se não houver pelo menos: 1 Foto "Antes", 1 "Durante", 1 "Depois", Lote do Módulo escrito, Client Sig preenchido, Tech Sig preenchido e O checkbox do termo de aceite checkado. 
4. **Camadas de Visualização/Impressão:** A OS tem modais que desaparecem via `CSS Rules (@media print)`. Existem classes como `print-client-hide` que esconderão preços, relatórios técnicos avançados ou relatórios de manutenção quando o Gerente clicar em `Imprimir Cliente`. Mas elas aparecerão se ele clicar `Imprimir Financeiro`.
5. **EPI Requirements Condicional:** Se uma OS for assinalada como "Exige uso de EPI", o "Passo 4" do checklist surge na tabela exigindo a foto obrigatória com cinto de segurança/capacete pelo funcionário antes de passar. 
6. **Periféricos Fixos e Abertos:** Os Cabos AC, DC, Dados, Chapas e Parafusos nascem populados como checkbox, o técnico deve checkar o que usa e informar quantidades dinamicamente. Sem limite em QTY.

---

# BLOCO 7 — MODELO DE DADOS RECONSTRUÍDO (Entities p/ Z.AI)

Ao criar as tabelas do Z.AI considere:

**Entidade 1: O Usuário / User**
- Precisa ter colunas separadas para identificador Z.AI de e-mail e as colunas analíticas `Role` e `Permission` para ACL. O App deles depende dessas chaves exatas em String.

**Entidade 2: Ordem de Serviço (WorkOrder)**
- Campos primitivos padrão (Título, Cliente, Descrição, DataAgendamento).
- Relacionar com 1 User (Owner/Assignee).
- Propriedade JSONB ou múltiplas colunas relacionadas para "Product Details" (resolução, WxH).
- Ter Entidade-filha ou campo array de JSONs para *TimeLogs* (a cada alteração Start/Pause grava-se log individual).
- Arrays persistidos pesados: Precisa guardar várias chaves de CDN (Storage) para Imagens (Fotos antes, durante, depois) e Vídeos.
- Relacionar as Assinaturas como strings Base64 persistidas em long text.

**Entidade 3: Configuração de Hardware em OS (Checklist)**
- O Checklist técnico pode ser transformado numa entidade complexa filha da OS. Guardando em booleanos o `isConform` e o `photoUrl` para o campo.
- Atenção ao array Estruturado de Periféricos (que detém {item: 'GABINETE', qty}). 

**Entidade 4: Veículo (Vehicle)**
- Placas, modelo do carro, odômetro atual.
- Relaciona de 1:N com as `Vistorias (VehicleCheck)`.

**Entidade 5: Vistoria de Veículo / Rota (VehicleCheck)**
- ID Veiculo, ID User. Timestamp e Hodometro de marcação. Nivel tank gas. Tipo (`CHECK_IN` vs `OUT`).
- Imagem de painel e Video Walkaround. Justificativa de dano que manda notificação se for preenchido no checkin (Regra automatizada).

**Entidade 6: Despesas (Expense)**
- Gasto corporativo. Link com ID do usuário que pediu reembolso, link optativo com OS ID, comprovante img, merchant, valor numérico decimal, status (aprovação do gerente).

---

# BLOCO 8 — COMPONENTES E CAMADAS IMPORTANTES

O App no Z.AI deve recriar componentes reativos chave:
- **Canvas Signature Pad:** (`components/ui.tsx - SignaturePad`): Uma superfície em HTML5 canvas configurada para ler touch e pointer events mobile onde o usuário desenha a assinatura e que, no clicar finalizar, é extraída usando `.toDataURL()` formatando em Base64 PNG. Isso tem que estar disponível como componente no Z.AI.
- **Visualizador Fuel Gauge:** Slider/Indicador de Combustível em arco (SVGs manipulando rotation CSS e range input), vital para o look-and-feel da app na tela Fleet.
- **Lightbox Visual (Media Viewer Modal):** Componente que abre e previne fechamento indesejado para o Gerente olhar os vídeos em background preto dos checkouts de frota e vídeos de execução da OS. Funciona renderizando tag `<video controls autoplay>` overlayd.
- **Kanban Drag-and-Drop (Visual):** Uma tab visual presente na listagem para enxergar de PENDENTES -> EXECUTANDO -> COMPLETO. Atual. a tela Kanban ali é meio estática, o ZAi pode fazer um Board funcional de ponta a ponta.
- **Timer de Tempo Executado (`elapsed`):** Interface que fica piscando e incrementando os segundos visuais via `setInterval` rodando toda OS quando um WorkOrder for carregando com `status='IN_PROGRESS'`.

---

# BLOCO 9 — INTEGRAÇÕES E PERSISTÊNCIA

1. **FireStore / Storage / Auth:** O sistema usa fortemente a infra nativa do GCloud para auth, guardando metadados dos Users numa Table Users avulsa, Storage é abusado (os uploads fotográficos são pesados, 3 arrays de imagens e 3 arrays de vídeo por OS). A Security Rule reflete de perto as roles aplicadas para travar intrusão.
2. **Identificação OCR com Google Gemini API (`analyzeReceipt`):** Integra-se com pacote `@google/genai`. Recebe do front uma Imagem via Base64 e pede pro modelo analisar `"Extraia Merchant, Amount, Date, Category em formato JSON válido"`. Deve ser convertido e mapeado para o "Node IA" / "Action IA" interno do builder Z.AI no fluxo de Upload de Recibo.
3. **BrasilAPI (`Calendar.tsx`):** Chamada de Fetch tradicional via `https://brasilapi.com.br/api/cep/v2/` em que, no "onBlur" do campo CEP da interface Novo Agendamento, a API reage poplando os blocos secundários estaduais. Pode ser Action HTTP Client.
4. **Google Calendar Data Sync:** Quando a Switch é marcada no calendário, pede OAuth token, emite payload na v3 rest do calendar `insertEvent`, botando o nome da empresa e titulo da OS na agenda visando sincronia no smartphone primario do instalador.

---

# BLOCO 10 — LEGADOS, GAPS E DÍVIDAS TÉCNICAS

Na reconstrução, ATENTE PARA ISSO e LIMPE o schema:
- **Sobrescrita Legada de Entidade Endereços:** O banco guarda um `address` livre string grande E UM NOVO obeto JSON `structuredAddress`. O código tem helper `composeLegacyAddress` para fundi-los. Mapear do Zero no Z.AI apenas como Objeto Relacional / Model Endereço Forte.
- **Propriedade AssignedTo:** Assim como o endereço acima, houve migração de guardarem o NOME LIVRE (`assignedTo`) e agora tem `assignedToUserId`, `assignedToEmail`. A função bloqueadora `isOrderAssignedToCurrentUser` faz acrobacias na String tentando adivinhar. Refaça no Z.AI criando chave única de relação 1:N restrita a Primary Key de User.
- **LocalMode / Mocking Pattern:** As views chamam `Store.saveWorkOrder`. O arquivo `dataGateway.ts` detecta ambiente. Se "Local", ele desce a árvore até `mockStore.ts`, salva no LocalStorage. Se o Z.AI for hospedar full stack, TODO esse proxy e lógica de "mockStore" não precisa mais existir e deve ser expurgado, conectando o Client diretamente a Z.AI DB ou Postgresql base.
- **Bug de Apropriação de Checklist Parcial (`checklist.cabinet.resolution` vs `pixelPitch`):** O `pixelPitch` das placas de LED possui redundância e no código atual ativa um alerta laranjão pedindo para o usuário ficar atento ao "legacy fallback" lendo campo apagado `resolution`. Consolidar no DB novo um campo só.
- **Oversight Semântico / Time Tracking:** O `totalTime` é salvo em segundos e confia 100% no counter do front-end (`elapsed`), não validando as tags reais de inicio/fim nos diffs de Data `new Date()`. Se o técnico recarregar a tab, ou a guia fechar, ele perde o incremento temporário local e só puxa do salvamento anterior. É um Gap grave pro business que deve ser computado via Delta UTC do server side Timestamp no Z.AI.

---

# BLOCO 11 — PLANO DE RECONSTRUÇÃO NO Z.AI

**REQUISITOS OBRIGATÓRIOS DO NOVO APP NO Z.AI:**

1. **Persistência de Banco Relacional/Documental Sólido:**
   - Criar Collections para: `Users`, `Vehicles`, `WorkOrders`, `VehicleChecks`, `Expenses`. Sub-entidades/objetos para `TimeLogs`, `Checklist` (Nested Fields).

2. **Fluxos a Desenhar (Workflows Visuais):**
   - **Trigger GPS Block:** Action nativa para forçar PWA/Navegador interceptar "Request Localização Exata".
   - **Fluxo AI no Z.AI:** Workflow "Ao Fazer Upload de Comprovante" que injeta Prompt no Gemini model, faz parse JSON da resposta e faz Bind dos dados pros inputs no Form do App na aba de reembolso.
   - **Impressão Dinâmica:** Estilizar "Containers" na UI do Z.AI marcando-os como "Esconder condicional ao imprimir" que geram relatórios simplificados pro Cliente e Complexos (com custos) para Financeiro da matriz.

3. **Automação Mobile-First PWA:**
   - Aplicativo a ser distribuído pros Técnicos necessita experiência nativa responsiva pra "bater fotos em série" (Antes, Durante e Depois).
   - Deve ser usado componentes de Native Camera access integrados já subindo as mídias direto prum Storage unificado sob o capo sem engascar.
   - Utilização intensiva do canvas-signature component validando o form para evitar saídas em brancos.

4. **Remodelagem e Otimizações de Redundância (Removas os Gaps):**
   - Eliminar os Arrays de Imagens Legadas.
   - Eliminar a duplicação de string nos Address e nomes.
   - Validar o `Elapsed` (Timer Tracker) somando pelo Timestamp Backend garantidamente para o salário/hora não desfalcar.

**PRIORIDADES NA ORDEM DE TRABALHO DE RECRIAÇÃO:**
- Passo 1: Modelagem das Entidades (O bloco de dados) limpos das sujas do passado Firebase.
- Passo 2: Construir Telas CRUDs do back-office de uso do `MANAGER` para popular Dados Mestre (Técnicos falsos e Carros da Garagem).
- Passo 3: Implementar Dashboard (com gráfico agregando area M²).
- Passo 4: Fazer as visões de lista dos Técnicos para acessarem pelo mobile os cards Pendentes.
- Passo 5: Criar O GRANDE formulário progressivo do Instalador (com o Timer ativo em Header Fixo + Fotos + Checklist Complexo Booleanos de conformidade técnicas e relatórios pós serviço).
- Passo 6: Anexar integração OCR e Assinaturas (acessórios avançados) para fechar o ecossistema.
