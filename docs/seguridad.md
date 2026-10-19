# Seguridad — Nub-studio-movil

Herramientas de seguridad del proyecto: qué revisa cada una, dónde corre y cómo usarla en local. Como referencia general se usa el estándar **OWASP MASVS** (requisitos de seguridad para apps móviles): https://mas.owasp.org/MASVS/

---

## 1. Resumen

En CI, las herramientas corren en las etapas **01 · Análisis estático** y **08 · Seguridad** de `ci.yml`, en cada Pull Request y también en la regresión de `release.yml` (ver `docs/pruebas/pipelines.md`).

| Herramienta | Qué revisa | Dónde corre |
|---|---|---|
| ESLint + Prettier | Errores comunes y formato | CI (etapa 01, `pnpm test:estatico`) y local |
| `pnpm audit` | Dependencias con vulnerabilidades conocidas | CI (etapa 08, `pnpm test:seguridad`) y local |
| TruffleHog | Secretos **verificados** (llaves que siguen activas) en los commits del PR | CI (etapa 08) |
| gitleaks | Secretos en el commit (local) y en todo el historial (CI), incluidos los que no se pueden verificar | Hook `pre-commit` y CI (etapa 08) |
| Semgrep | Patrones de código inseguro en JavaScript/React (SAST) | CI (etapa 08) y local |
| Dependabot | Alertas y PR de actualizaciones de seguridad | GitHub |
| MobSF | La app **compilada** (APK): permisos, tráfico HTTP, llaves dentro del código | Local, antes de cada release |

---

## 2. Hook de gitleaks (cada integrante, una sola vez)

Revisa los cambios de cada commit antes de que salgan de tu computadora.

```bash
sudo pacman -S gitleaks                 # Arch/CachyOS; en otros sistemas: https://github.com/gitleaks/gitleaks#installing
git config core.hooksPath .githooks     # dentro del repositorio
```

Si no tienes gitleaks instalado, el hook solo muestra un aviso y deja hacer el commit. Si encuentra algo, el commit se detiene: quita el secreto. Si crees que es un falso positivo, coméntalo con el equipo antes de usar `git commit --no-verify`.

Revisar todo el historial a mano: `gitleaks git --redact --verbose`

---

## 3. Semgrep en local

```bash
pipx install semgrep        # o: uv tool install semgrep
semgrep scan --config p/javascript --config p/react --exclude docs --metrics off
```

---

## 4. Dependencias

```bash
pnpm test:seguridad          # = pnpm audit --prod --audit-level high
```

Las versiones de Expo y React Native van atadas al SDK. Para corregir versiones usa `pnpm expo install --fix`, no actualices a mano.

**Dependabot** está configurado para abrir **solo PR de seguridad** hacia `develop`. Hay que activarlo en GitHub: *Settings → Code security* → "Dependabot alerts" y "Dependabot security updates".

---

## 5. MobSF sobre el APK (antes de cada release)

Analiza el APK de `preview` o `production` generado con EAS.

```bash
sudo pacman -S docker && sudo systemctl start docker
docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest
```

Abre http://localhost:8000, sube el APK y revisa el reporte.

**Hallazgo esperado:** en el APK de `preview` aparece el tráfico HTTP sin cifrar permitido. Es intencional, para conectarse al backend local por Wi-Fi. En el build de `production` **no** debe aparecer.
