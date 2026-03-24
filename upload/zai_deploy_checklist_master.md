# 📦 Z.AI — ARQUIVO MESTRE DE DEPLOY (PRODUÇÃO)

---

## 🎯 OBJETIVO
Garantir que qualquer sistema desenvolvido no Z.AI funcione corretamente em ambiente de **deploy (produção)**, evitando falhas comuns do ambiente de preview.

---

# 🧱 1. ARQUITETURA BASE

## ✔ Estrutura correta
- Backend = fonte da verdade
- Frontend = interface (sem lógica crítica)

## ❌ Proibido
- Regras de negócio no frontend
- Dados armazenados em memória

---

# 💾 2. BANCO DE DADOS (OBRIGATÓRIO)

## ✔ Usar
- PostgreSQL
- Supabase
- Firebase

## ❌ Não usar
- localStorage
- useState como persistência
- arquivos locais

## 🔒 Regra
> Se reiniciar o sistema e perder dados → ERRADO

---

# 📁 3. STORAGE (UPLOADS)

## ✔ Usar
- S3
- Cloudinary
- Supabase Storage

## ❌ Não usar
- /tmp
- /uploads local

## 🔒 Regra
> Arquivo precisa sobreviver ao restart

---

# 🔑 4. VARIÁVEIS DE AMBIENTE

## ✔ Obrigatório
- DATABASE_URL
- API_KEYS
- BASE_URL

## ❌ Proibido
- Hardcode de chave

## 🔒 Regra
> Sem .env correto = sistema não deve funcionar

---

# 🌐 5. ROTAS E URL

## ✔ Usar
- Rotas relativas (/api/...)

## ❌ Não usar
- localhost
- IP fixo

---

# 🔐 6. AUTENTICAÇÃO

## ✔ Usar
- JWT
- Auth externo

## ❌ Evitar
- Sessão local simples

---

# 📦 7. DEPENDÊNCIAS

## ✔ Garantir
- Tudo no package.json

## 🔒 Regra
> Novo servidor deve rodar sem ajustes

---

# ⚙️ 8. BUILD

## ✔ Validar
- Build sem erros

## 🔒 Regra
> Se só roda em preview = inválido

---

# 🔐 9. PERMISSÕES

## ✔ Considerar
- Ambiente restrito

## ❌ Não depender
- Escrita local
- Portas abertas manualmente

---

# 🌍 10. REQUESTS / API

## ✔ Implementar
- try/catch
- timeout

---

# 🔄 11. REALTIME

## ✔ Prever
- fallback (polling)

---

# 🌐 12. CORS

## ✔ Liberar
- domínio do deploy

---

# 📊 13. LOGS

## ✔ Implementar
- logs visíveis

---

# 🧠 14. REGRA DE OURO

> Preview NÃO é produção

---

# 🏗️ 15. MODELO PARA SISTEMA DE OS (SEU CASO)

## Backend (obrigatório)
- OS
- Despesas
- Usuários
- Budget

## Frontend
- Formulário do técnico
- Interface rápida

## Fluxo
1. Gestor cria OS
2. Técnico preenche (tipo formulário)
3. Técnico envia despesas
4. Supervisor aprova
5. Admin valida final

---

# 🔥 CHECK FINAL

- [ ] Dados persistem após restart
- [ ] Uploads não se perdem
- [ ] Sem localhost no código
- [ ] Sem API key hardcoded
- [ ] Build funciona limpo
- [ ] Funciona em domínio real

---

# 🚀 STATUS

Se todos os itens estiverem OK:

> ✅ SISTEMA PRONTO PARA DEPLOY NO Z.AI

---

