# Guia de Publicação — MedAlert nas Lojas (Google Play Store e Apple App Store)

---

## Parte 1: Google Play Store (Android)

### Pré-requisitos

- Conta de desenvolvedor Google Play — [cadastro aqui](https://play.google.com/console/signup) (taxa única de US$ 25)
- Build de produção gerado via EAS (`eas build -p android --profile production`)
- Ícones e screenshots do app prontos
- Política de privacidade publicada em uma URL pública

### Passo 1: Gerar o build de produção

```bash
cd mobile
eas build --platform android --profile production
```

Isso gera um `.aab` (Android App Bundle) otimizado para a Play Store.

### Passo 2: Criar o app na Play Console

1. Acesse [play.google.com/console](https://play.google.com/console)
2. Clique em **"Criar app"**
3. Preencha:
   - Nome do app: `MedAlert`
   - Idioma padrão: Português (Brasil)
   - Tipo: App
   - Gratuito ou pago: Gratuito
4. Aceite as declarações e clique em **"Criar app"**

### Passo 3: Configurar a ficha da loja

Em **Presença na loja → Ficha principal da loja**:

| Campo | Valor |
|-------|-------|
| Nome | MedAlert |
| Descrição breve | Controle de medicamentos e lembretes para idosos |
| Descrição completa | App de alertas e controle de medicamentos voltado a idosos. Notifica pacientes no horário de cada tomada, confirma a adesão ao tratamento e alerta familiares/cuidadores em caso de falha. |
| Categoria | Saúde e fitness |
| Ícone | 512×512 PNG (sem transparência) |
| Gráfico de recursos | 1024×500 PNG |
| Screenshots | Mínimo 2 (recomendado 4-8), resolução 16:9 ou 9:16 |

### Passo 4: Configurar classificação de conteúdo

Em **Política → Classificação de conteúdo**:

1. Inicie o questionário
2. Categoria: Utilitário / Saúde
3. Responda que o app NÃO contém violência, conteúdo sexual, linguagem imprópria, etc.
4. O app receberá classificação **Livre** (L)

### Passo 5: Configurar política de privacidade

Em **Política → Privacidade do app**:

- Informe a URL da sua política de privacidade (pode hospedar no GitHub Pages ou qualquer site)
- Marque que o app coleta dados de saúde (medicamentos) e dados pessoais (nome, email)
- Preencha o formulário de segurança de dados

### Passo 6: Configurar preço e distribuição

Em **Monetização → Preço do app**:

- Selecione **Gratuito**
- Selecione os países de distribuição (Brasil ou todos)

### Passo 7: Upload do AAB

Em **Versão → Produção**:

1. Clique em **"Criar nova versão"**
2. Faça upload do arquivo `.aab` gerado pelo EAS
3. Preencha as notas da versão:
   ```
   Versão 1.0.0
   - Controle de medicamentos e agendas
   - Notificações de tomada
   - Histórico de adesão
   - Modo escuro
   ```
4. Clique em **"Revisar versão"** → **"Iniciar lançamento para produção"**

### Passo 8: Aguardar revisão

- A primeira revisão do Google leva **1 a 7 dias**
- Você recebe email quando for aprovado ou se houver rejeição
- Após aprovação, o app aparece na Play Store em até 24h

### Submissão automática via EAS (opcional)

Após configurar uma vez, pode automatizar:

```bash
eas submit --platform android --latest
```

Isso envia o último build diretamente para a Play Console sem upload manual.

---

## Parte 2: Apple App Store (iOS)

### Pré-requisitos

- Conta Apple Developer — [cadastro aqui](https://developer.apple.com/programs/) (US$ 99/ano)
- Mac com Xcode instalado (necessário para certificados)
- Build de produção iOS via EAS
- Ícones, screenshots e política de privacidade

### Passo 1: Configurar credenciais iOS

```bash
eas credentials --platform ios
```

O EAS guia você para:
- Criar um Distribution Certificate
- Criar um Provisioning Profile
- Tudo pode ser gerenciado automaticamente pelo EAS (recomendado)

### Passo 2: Gerar o build de produção iOS

```bash
eas build --platform ios --profile production
```

Gera um `.ipa` assinado e pronto para a App Store.

### Passo 3: Criar o app no App Store Connect

1. Acesse [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Vá em **"Meus Apps"** → botão **"+"** → **"Novo App"**
3. Preencha:
   - Nome: `MedAlert`
   - Idioma principal: Português (Brasil)
   - Bundle ID: `com.seuusuario.medalert` (deve coincidir com o `app.json`)
   - SKU: `medalert-001`
4. Clique em **"Criar"**

### Passo 4: Configurar informações do app

Na aba **"Informações do App"**:

| Campo | Valor |
|-------|-------|
| Categoria primária | Saúde e fitness |
| Categoria secundária | Medicina |
| Classificação etária | 4+ (sem conteúdo restrito) |
| URL de privacidade | https://seu-site.com/privacidade |

### Passo 5: Configurar a versão

Na aba da versão (1.0):

- **Screenshots**: obrigatórias para iPhone 6.7" e 5.5" (mínimo)
- **Descrição**: mesma da Play Store
- **Palavras-chave**: medicamento, lembrete, idoso, saúde, tomada, cuidador
- **URL de suporte**: link para contato ou FAQ
- **Notas de revisão**: explique ao revisor como testar (forneça login de teste)

### Passo 6: Fornecer conta de teste para revisão

A Apple exige uma conta de demonstração para testar o app:

```
Email: revisor@medalert.com
Senha: Teste@123456
```

Crie esse usuário no seu backend antes de submeter.

### Passo 7: Upload do IPA

**Opção A — Via EAS Submit (recomendado):**

```bash
eas submit --platform ios --latest
```

O EAS envia o `.ipa` diretamente para o App Store Connect.

**Opção B — Via Transporter (Mac):**

1. Baixe o app [Transporter](https://apps.apple.com/app/transporter/id1450874784) na Mac App Store
2. Arraste o `.ipa` para o Transporter
3. Clique em "Entregar"

### Passo 8: Selecionar o build e submeter

1. No App Store Connect, vá na versão 1.0
2. Na seção **"Build"**, clique em **"+"** e selecione o build enviado
3. Preencha as informações de exportação (criptografia: selecione "Não" se não usa criptografia própria além de HTTPS)
4. Clique em **"Enviar para revisão"**

### Passo 9: Aguardar revisão

- A revisão da Apple leva **1 a 3 dias** (pode ser 24h)
- Se rejeitado, você recebe o motivo e pode corrigir e resubmeter
- Após aprovação, o app é publicado automaticamente (ou na data que você escolher)

### Motivos comuns de rejeição pela Apple

| Motivo | Solução |
|--------|---------|
| Crash na abertura | Teste bem antes de submeter |
| Login não funciona | Forneça conta de teste válida |
| Sem política de privacidade | Adicione URL no App Store Connect |
| Metadata incompleta | Preencha todos os campos obrigatórios |
| Funcionalidade incompleta | Não submeta com features "em breve" |
| Push sem permissão clara | Explique ao usuário por que precisa de notificações |

---

## Resumo de comandos EAS

| Ação | Comando |
|------|---------|
| Build Android produção | `eas build -p android --profile production` |
| Build iOS produção | `eas build -p ios --profile production` |
| Submit Android | `eas submit -p android --latest` |
| Submit iOS | `eas submit -p ios --latest` |
| Build + Submit juntos | `eas build -p android --profile production --auto-submit` |
| Ver status | `eas build:list` |

---

## Checklist pré-publicação

- [ ] Ícone do app em alta resolução (1024×1024 para iOS, 512×512 para Android)
- [ ] Screenshots de todas as telas principais (mínimo 4)
- [ ] Política de privacidade publicada em URL acessível
- [ ] Conta de teste criada no backend (para revisão da Apple)
- [ ] `EXPO_PUBLIC_API_URL` apontando para o backend de produção
- [ ] Versão e versionCode/buildNumber incrementados
- [ ] Testado em dispositivo real (não apenas emulador)
- [ ] Push notifications configuradas (FCM key para Android, APNs para iOS)
- [ ] Sem console.log ou dados de debug no código

---

## Custos

| Item | Custo |
|------|-------|
| Conta Google Play | US$ 25 (única vez) |
| Conta Apple Developer | US$ 99/ano |
| EAS Build (plano gratuito) | US$ 0 (30 builds/mês) |
| Hospedagem backend | Variável (AWS, Railway, Render, etc.) |

---

## Referências

- [EAS Submit — Documentação](https://docs.expo.dev/submit/introduction/)
- [Google Play Console — Guia](https://support.google.com/googleplay/android-developer/answer/9859152)
- [App Store Connect — Guia](https://developer.apple.com/help/app-store-connect/)
- [Expo — Publicação completa](https://docs.expo.dev/distribution/introduction/)
