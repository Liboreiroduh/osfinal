# Mapeamento Visual — Programa de Geração de OS em Python

## Página inicial / Dashboard

### Objetivo
Exibir uma visão analítica e operacional das instalações, permitindo tomada de decisão rápida.

### Filtros disponíveis
- Período
- Estado
- Status da OS
- Técnico responsável
- Tipo de OS

#### Comportamento do filtro de período
- Deve ter filtros rápidos de seleção
- Exemplo de lógica: hoje, semana, mês, período personalizado
- Quando o usuário escolher a opção personalizada, devem abrir os campos de data inicial e data final para definição manual do intervalo

### Componentes principais
- Dashboards de instalação com gráficos
- Cada gráfico deve permitir visualização dinâmica conforme filtros aplicados

### Funcionalidades
- Cada dashboard deve possuir opção de exportar o recorte filtrado em Excel

### Diretriz visual
- Layout baseado em gráficos (visão analítica)
- Interação rápida com filtros
- Clareza na leitura dos dados



## Página 2 / Criação de OS

### Regra de acesso
- Página visível somente para admin e supervisor

### Objetivo
- Permitir a criação de uma nova OS a partir do calendário operacional
- A criação da OS deve nascer como um novo checklist de OS

### Estrutura da página
- A página deve ter um calendário no estilo Google Agenda como elemento principal
- Ao clicar em um dia do calendário, deve abrir o formulário de criação da OS

### Lógica de uso
- O admin ou supervisor seleciona a data no calendário
- Após o clique no dia, o sistema abre o formulário da OS para preenchimento
- Após o preenchimento, a OS fica vinculada à data escolhida no calendário

### Campos do formulário de criação da OS

#### Bloco: Dados base da OS
- Nome do cliente — campo de texto
- Data do atendimento — campo de data
- Técnico responsável — campo seletor
- CEP — campo de texto com suporte a preenchimento automático via API
- Estado — campo de texto com preenchimento automático via CEP
- Cidade — campo de texto com preenchimento automático via CEP
- Logradouro — campo de texto com preenchimento automático via CEP
- Número — campo de texto
- Bairro — campo de texto com preenchimento automático via CEP
- Complemento — campo de texto
- Referência — campo de texto

#### Regra de preenchimento automático
- O preenchimento automático de endereço será feito via API de CEP
- A documentação técnica dessa API será adicionada depois
- Ao informar um CEP válido, o sistema deve preencher automaticamente os campos de endereço correspondentes
- Mesmo com autopreenchimento, os campos devem continuar editáveis manualmente

#### Bloco: Projeto
- Tipo do painel — campo seletor
- Quantidade de painéis — campo numérico
- Pixel Pitch — campo de texto ou seletor, conforme definição futura
- Processadora — campo de texto único para marca/modelo
- Quantidade da processadora — campo numérico

#### Bloco: Despesas
- Budget total — campo monetário

#### Bloco: Observações
- Observações do gerente — campo de texto longo
- Esse campo funciona como recado direto para o técnico

### Diretriz visual
- Calendário com destaque como ponto principal da tela
- Formulário visualmente limpo, em blocos bem separados
- Aparência parecida com o padrão das imagens enviadas
- Experiência rápida e objetiva para criação da OS


## Página 3 / OS e Checklist do Técnico

### Visualização por perfil

#### Admin / Supervisor
- As OS criadas devem aparecer no calendário
- Acima do calendário deve existir filtro de técnico
- O filtro de técnico deve permitir selecionar mais de um técnico ao mesmo tempo
- O padrão inicial do filtro deve vir com todos os técnicos selecionados

#### Técnico
- O técnico verá apenas as OS que foram criadas para ele
- Ao clicar em uma OS, deve abrir o formulário de checklist correspondente

### Objetivo da página
- Transformar a OS criada em execução prática de campo
- Permitir que o técnico preencha o checklist da OS de forma rápida e objetiva

### Estrutura da página
- Para gestor: visual em calendário com filtro de técnico
- Para técnico: lista ou agenda das OS atribuídas a ele, com acesso direto ao checklist ao clicar

### Próxima etapa de definição
- A partir daqui será desenvolvido o formulário de checklist da OS
- Essa página será detalhada bloco por bloco na sequência

### Bloco 0 / Abertura da OS (Notificação obrigatória)

#### Comportamento
- Ao abrir a OS, deve aparecer uma notificação em tela
- A notificação deve exigir confirmação (botão OK)

#### Conteúdo da notificação
- Orientação para o técnico não esquecer de registrar evidências da OS
- Aviso claro: obrigatório subir fotos de antes, durante e depois

---

### Bloco 1 / Resumo travado / Cabeçalho da OS

#### Objetivo
- Exibir, no topo da OS, um resumo fixo com os dados principais definidos na criação
- Esse bloco deve funcionar como cabeçalho travado durante o preenchimento do checklist

#### Campos exibidos
- Cliente
- Data
- Técnico responsável principal
- Técnicos adicionais
- Endereço
- Tipo do painel
- Quantidade de gabinetes/módulos
- Pixel Pitch
- Processadora
- Observações do gerente

#### Regra de comportamento
- Esse bloco é apenas de visualização para quase todos os campos
- Os dados vêm da criação da OS
- O técnico não edita esse cabeçalho dentro do checklist, com uma única exceção
- O bloco deve permanecer visível como referência durante o preenchimento

#### Exceção de edição permitida ao técnico
- No campo de técnico responsável deve existir um botão de mais
- O técnico poderá usar esse botão para incluir novos técnicos na OS
- Ao clicar, ele deve selecionar um ou mais técnicos para atuar junto com ele
- Essa é a única edição de base que o técnico poderá fazer dentro da OS

#### Diretriz visual
- Cabeçalho fixo no topo
- Visual limpo e de leitura rápida
- Informações organizadas em formato resumido para o técnico bater o olho e entender o contexto da OS imediatamente


### Bloco 2 / Status atual da OS

#### Objetivo
- Mostrar o andamento operacional da OS durante a execução
- Registrar o comportamento de início, pausa, retomada e finalização

#### Informações exibidas
- Status atual
- Quantidade de pausas
- Tempo total acumulado
- Data de finalização

#### Valores de status
- Iniciado
- Pausado
- Finalizado

#### Regras de comportamento
- O sistema deve registrar timestamp toda vez que o técnico iniciar a OS
- O sistema deve registrar timestamp toda vez que o técnico pausar a OS
- O sistema deve registrar timestamp toda vez que o técnico retomar a OS
- O sistema deve registrar timestamp quando a OS for finalizada
- A quantidade de pausas deve ser contada automaticamente
- O tempo total deve ser calculado com base nos períodos efetivamente trabalhados
- A data de finalização só deve aparecer quando a OS for encerrada

#### Histórico operacional
- Deve existir um pequeno histórico visível dentro desse bloco
- Esse histórico deve mostrar cada ação feita pelo técnico ao longo da OS
- Exemplo de eventos no histórico: iniciou, pausou, retomou, finalizou
- O histórico também deve mostrar quantas vezes o técnico realizou essas ações durante a execução

#### Diretriz visual
- Bloco compacto e de leitura rápida
- Status atual com destaque visual
- Histórico curto logo abaixo ou ao lado, sem ocupar espaço excessivo
- Estrutura pensada para o técnico entender rapidamente em que ponto está a OS

---

### Bloco 3 / Checklist técnico

#### Objetivo
- Permitir o preenchimento prático do checklist de execução em campo
- Garantir validação visual e evidência de cada etapa realizada

#### Estrutura
- Cada item do checklist deve possuir três botões de ação:
  - Conforme / Aprovado
  - Não conforme / Aprovado
  - Não conforme / Travado

#### Regra de comportamento
- Ao selecionar qualquer uma das três opções, o sistema deve obrigar o envio de uma imagem
- A imagem deve ser vinculada diretamente ao item do checklist respondido
- O envio da imagem é obrigatório para validação da etapa

#### Upload de imagem
- A imagem enviada deve ficar disponível no front-end
- Deve ser possível visualizar a imagem associada a cada resposta
- A visualização deve ser rápida e integrada ao item do checklist

#### Sub-bloco: Energia
- Mesma estrutura de checklist com os três botões
- Campo adicional:
  - Tensão — campo manual
- Obrigatório envio de foto

#### Sub-bloco: Dados / Rede
- Resposta conforme a marcação
- Upload de fotos de acordo com a marcação
- Sem campos extras além das evidências visuais

---

### Bloco 4 / Processadora

#### Estrutura
- A processadora deve aparecer já escrita com base no que foi criado pelo supervisor

#### Campos
- Quantidade recebida — campo numérico
- Lote — campo de texto
- OK — botão de validação

---

### Bloco 5 / Gabinete / Módulo

#### Estrutura
- Exibir primeiro o tipo: gabinete ou módulo
- Exibir a quantidade planejada

#### Campos
- Quantidade recebida — campo numérico
- Lote — campo de texto
- OK — botão de validação

---

### Bloco 6 / Itens fixos da OS

#### Estrutura
- Lista de itens com checkbox
- Ao marcar o item, deve aparecer campo para preencher a quantidade

#### Itens
- Cabo AC
- Cabo DC
- Cabo de dados
- Chapa
- Parafuso
- Computador

---

### Bloco 7 / Itens faltantes

#### Regra
- Não obrigatório
- Só aparece se o técnico indicar que existem itens faltantes

#### Campos
- Descrição dos itens faltantes — campo de texto
- Foto — upload opcional

---

### Bloco 8 / Evidências da OS (Antes / Durante / Depois)

#### Estrutura
- Antes da execução — upload de imagem
- Durante a execução — upload de imagem
- Depois da execução — upload de imagem

#### Regra
- Esse bloco é obrigatório
- As três etapas devem possuir pelo menos uma imagem
- As imagens devem ficar visíveis no front-end organizadas por etapa

---

### Bloco 9 / Relatório de fechamento

#### Campos
- Relatório final — campo de texto livre
- Observações finais — campo de texto livre

#### Regra
- Preenchimento opcional, caso necessário

---

### Bloco 10 / Assinaturas

#### Estrutura
- Assinatura do cliente
- Assinatura do técnico

#### Regra
- Assinatura feita diretamente na tela, no celular ou no computador
- Deve existir um box de assinatura
- A assinatura deve ser salva como imagem

---

### Bloco 11 / Despesas (pós-fechamento da OS)

#### Regra de visibilidade
- Esse bloco só aparece após a OS estar finalizada

#### Objetivo
- Registrar os custos reais da execução da OS

#### Estrutura
- Exibir o Budget total definido pelo gestor/supervisor
- Botão “Novo” para adicionar despesa

#### Tipos de despesa (seletor)
- Transporte
- Alimentação
- Hospedagem
- Outros

#### Comportamento
- Ao selecionar “Outros”, deve abrir campos adicionais:
  - Tipo da despesa — campo de texto
  - Valor — campo monetário
- Para os demais tipos:
  - Valor — campo monetário

#### Regras
- Permitir múltiplas despesas por OS
- Cada despesa deve ser registrada individualmente
- As despesas devem ficar listadas abaixo do botão “Novo”
- Deve ser possível visualizar o total gasto vs budget
- O técnico pode incluir novas despesas e excluir despesas já lançadas quantas vezes for necessário enquanto a aprovação do supervisor ainda não tiver ocorrido
- Após a aprovação do supervisor, o técnico não poderá mais incluir, editar ou excluir despesas nessa OS
- Depois da aprovação, os lançamentos de despesas ficam travados para o técnico

## Página 4 / Gestão de despesas

### Objetivo
- Centralizar a gestão financeira das OS já concluídas
- Permitir que técnico, supervisor e gestores acompanhem despesas e comprovantes vinculados à OS

### Regra de visibilidade
- Essa página só deve exibir OS já concluídas
- A despesa só pode ser lançada depois que a OS estiver concluída

### Relação com a OS
- A página de despesas é vinculada diretamente à OS
- Ela não substitui a OS
- Ela serve para registrar, revisar e aprovar os gastos do projeto após a conclusão operacional

### Visualização por perfil

#### Técnico
- Pode acessar as OS concluídas atribuídas a ele
- Pode incluir, editar e excluir despesas enquanto o supervisor ainda não tiver aprovado
- Pode anexar comprovantes e ajustar lançamentos quando solicitado

#### Supervisor
- Pode revisar despesas, comprovantes e valores lançados
- Pode pedir correção antes de aprovar
- Pode aprovar a etapa financeira quando estiver tudo correto
- Se o valor total lançado ultrapassar o budget, o supervisor ainda pode aprovar, mas o status deve seguir para aprovação final do gestor/admin

#### Admin
- Pode visualizar todas as OS concluídas e suas despesas
- Pode conferir comprovantes, solicitar correções e acompanhar o histórico
- Após a aprovação do supervisor, somente o admin pode devolver a etapa financeira para correção pelo técnico
- Quando houver estouro de budget, o gestor/admin será o responsável pela aprovação final

### Estrutura da página
- Lista de OS concluídas com acesso à gestão de despesas
- Cada OS deve exibir:
  - Cliente
  - Data
  - Técnico
  - Budget total
  - Total já lançado
  - Diferença entre budget e gasto
  - Status financeiro

### Funcionalidades
- Inclusão de despesas por categoria
- Edição de despesas antes da aprovação do supervisor
- Exclusão de despesas antes da aprovação do supervisor
- Upload e visualização de comprovantes
- Solicitação de correção
- Aprovação financeira
- Devolução para ajuste
- Histórico completo de alterações e status

### Categorias de despesa
- Transporte
- Alimentação
- Hospedagem
- Outros

### Regra para categoria Outros
- Ao selecionar Outros, o usuário deve escrever o tipo da despesa
- Também deve informar o valor

### Controle de budget
- O budget total do projeto deve aparecer de forma visível
- O técnico deve acompanhar quanto já foi gasto dentro desse budget
- Os valores devem aparecer separados por categoria
- O sistema deve mostrar claramente quando o gasto total ultrapassar o budget

### Regra de aprovação com estouro de budget
- Se o total de despesas ultrapassar o budget, o supervisor pode aprovar a conferência inicial
- Nesse caso, a OS deve ficar com status de aprovado pendente
- Ao aprovar acima do budget, o supervisor deve escrever uma explicação obrigatória do motivo da aprovação
- A aprovação final ficará restrita ao admin

### Regras de bloqueio
- Antes da aprovação do supervisor: técnico pode incluir, editar e excluir despesas
- Após a aprovação do supervisor: técnico não pode mais alterar a parte financeira
- Após a aprovação do supervisor, somente o admin pode devolver a etapa financeira para o técnico ajustar

### Status financeiros sugeridos
- Em lançamento
- Em revisão
- Correção solicitada
- Aprovado pelo supervisor
- Aprovado pendente
- Aprovado final

### Histórico
- Cada mudança de status deve aparecer no histórico
- Toda devolução para correção deve exigir motivo escrito
- O histórico deve registrar:
  - alteração de status
  - usuário responsável pela mudança
  - data e hora
  - motivo da correção, quando existir

### Diretriz visual
- Página focada em conferência rápida
- Visualização clara de budget, gasto total e pendências
- Fácil leitura dos comprovantes
- Histórico visível sem poluir a tela


## Página 5 / Gestão de usuários

### Objetivo
- Administrar os usuários do sistema e suas permissões de acesso

### Funcionalidades
- Inclusão de usuário
- Exclusão de usuário
- Troca de senha
- Definição de perfil de acesso

### Perfis de acesso

#### Admin
- Acessa e edita tudo no sistema
- Pode aprovar gastos acima do budget em decisão final
- Pode devolver etapas financeiras já aprovadas pelo supervisor para correção do técnico
- Pode gerenciar usuários, senhas e permissões

#### Supervisor
- Edita tudo no sistema dentro do fluxo operacional
- Pode criar OS
- Pode revisar e aprovar despesas dentro do budget
- Pode aprovar despesas acima do budget apenas como aprovação inicial
- Quando aprovar acima do budget, o sistema deve gerar status de aprovado pendente
- Nessa aprovação pendente, o supervisor deve escrever uma explicação obrigatória para o admin analisar

#### Técnico
- Só visualiza o que é dele
- Pode preencher checklist das OS atribuídas
- Pode lançar, editar e excluir despesas da própria OS enquanto ainda não houver aprovação do supervisor
- Não pode aprovar financeiramente
- A única edição de base permitida ao técnico é incluir técnicos adicionais na OS pelo botão de mais no campo de técnico responsável

### Estrutura da página
- Lista de usuários cadastrados
- Nome
- E-mail ou login
- Perfil
- Status do usuário
- Ações disponíveis

### Ações disponíveis por usuário
- Editar cadastro
- Alterar senha
- Ativar ou desativar acesso
- Excluir usuário
- Alterar perfil de acesso

### Diretriz visual
- Tela simples e administrativa
- Leitura rápida dos perfis
- Ações objetivas de gestão de acesso
