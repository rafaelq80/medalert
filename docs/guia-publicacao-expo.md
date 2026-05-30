# Guia de Publicação — MedAlert Mobile na Nuvem Expo (EAS)

## Pré-requisitos

- Node.js 18+ instalado
- Conta gratuita no [Expo](https://expo.dev/signup)
- Projeto MedAlert mobile funcional (`npx expo run:android` rodando)

---

## 1. Instalar EAS CLI

```bash
npm install -g eas-cli
```

## 2. Fazer login no Expo

```bash
eas login
```

Informe email e senha da sua conta Expo.

## 3. Configurar o projeto

Na pasta `mobile/`:

```bash
eas build:configure
```

Isso cria o arquivo `eas.json` com perfis de build. Se já existir, pule este passo.

## 4. Configurar `eas.json`

Edite o `eas.json` na raiz do mobile:

```json
{
  "cli": {
    "version": ">= 13.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## 5. Configurar `app.json`

Verifique que o `app.json` tem os campos obrigatórios:

```json
{
  "expo": {
    "name": "MedAlert",
    "slug": "medalert",
    "version": "1.0.0",
    "android": {
      "package": "com.seuusuario.medalert",
      "versionCode": 1
    },
    "ios": {
      "bundleIdentifier": "com.seuusuario.medalert",
      "buildNumber": "1.0.0"
    }
  }
}
```

> Substitua `com.seuusuario.medalert` pelo seu identificador único.

## 6. Build de desenvolvimento (APK para testar)

```bash
eas build --platform android --profile development
```

O build roda na nuvem do Expo (gratuito, com fila). Ao finalizar, você recebe um link para download do APK.

## 7. Build de preview (APK para distribuir internamente)

```bash
eas build --platform android --profile preview
```

Gera um APK que pode ser instalado em qualquer dispositivo Android sem precisar da Play Store.

## 8. Instalar o APK no dispositivo

Após o build finalizar, você tem 3 formas de instalar:

### Opção A: Link direto no terminal

Quando o build termina, o terminal mostra:
```
✔ Build finished
🤖 Android: https://expo.dev/artifacts/eas/abcdef123.apk
```

Abra esse link no navegador do celular → baixa o APK → toque no arquivo → Instalar.

### Opção B: QR Code no dashboard

1. Acesse [expo.dev](https://expo.dev) e faça login
2. Vá em seu projeto → aba **Builds**
3. Clique no build desejado → botão **"Install"**
4. Um QR code aparece na tela
5. Escaneie com a câmera do celular → abre o link → baixa → instala

### Opção C: Emulador local

```bash
eas build:run --platform android
```

Instala diretamente no emulador conectado.

### Observações

- O APK gerado é **standalone** — não precisa do Expo Go instalado
- Na primeira instalação, o Android pede para habilitar **"Instalar apps de fontes desconhecidas"** nas configurações do navegador. Permita uma vez.
- O app funciona independente, como qualquer app instalado normalmente

## 9. Build de produção (AAB para Play Store)

```bash
eas build --platform android --profile production
```

Gera um `.aab` (Android App Bundle) pronto para upload na Google Play Console.

## 10. Publicar atualizações OTA (Over-The-Air)

Após o primeiro build, você pode enviar atualizações de JS sem rebuild:

```bash
eas update --branch production --message "Correção de bug X"
```

Isso atualiza o app instantaneamente para todos os usuários sem passar pela Play Store.

---

## Comandos resumidos

| Ação | Comando |
|------|---------|
| Login | `eas login` |
| Build dev (APK) | `eas build -p android --profile development` |
| Build preview (APK) | `eas build -p android --profile preview` |
| Build produção (AAB) | `eas build -p android --profile production` |
| Atualização OTA | `eas update --branch production -m "mensagem"` |
| Ver builds | `eas build:list` |
| Ver status | `eas build:view` |

---

## Limites do plano gratuito Expo

- **30 builds/mês** (Android + iOS combinados)
- **Fila compartilhada** — builds podem demorar 10-30 min
- **1 GB de armazenamento** para updates OTA
- **Sem limite** de updates OTA
- **Sem limite** de dispositivos para distribuição interna

---

## Variáveis de ambiente

Para que o app se conecte ao backend em produção, configure a URL da API:

```bash
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://sua-api.com/api/v1"
```

Ou adicione no `eas.json` dentro do perfil:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://sua-api.com/api/v1"
      }
    }
  }
}
```

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Build falha com "missing credentials" | Rode `eas credentials` para configurar keystore |
| APK não instala | Habilite "Fontes desconhecidas" no Android |
| App não conecta ao backend | Verifique `EXPO_PUBLIC_API_URL` e se o backend está acessível |
| Build demora muito | Plano gratuito usa fila compartilhada — aguarde ou upgrade para Priority |

---

## Referências

- [Documentação EAS Build](https://docs.expo.dev/build/introduction/)
- [Documentação EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [Distribuição interna](https://docs.expo.dev/build/internal-distribution/)
