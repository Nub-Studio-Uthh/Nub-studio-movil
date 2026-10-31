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

### Avisos ignorados

Cuando una vulnerabilidad no tiene corrección compatible con el SDK, se ignora en `auditConfig.ignoreGhsas` de `pnpm-workspace.yaml` y se explica aquí. Hay que revisar esta lista en cada actualización del SDK y quitar los avisos que ya tengan corrección.

| Aviso | Paquete | Por qué se ignora | Desde |
| --- | --- | --- | --- |
| [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | `zod` 3.25.76 (alta: consumo de memoria con colecciones muy grandes) | Solo lo usa `@expo/cli`, la herramienta que compila en local y en CI; no va dentro del APK y la app no lo usa. La corrección solo existe en `zod` 4.6.6, y hasta la última versión de `@expo/cli` pide `zod` 3. Se quita cuando Expo actualice. | 23/10/2026 (#90) |
| GHSA-vfj7-8cjw-p6xm, GHSA-86w9-cpqp-85rv | — | Agregados antes de esta tabla (commit `2d55066`). | — |

### Versiones forzadas (`overrides`)

Cuando la corrección existe pero una dependencia interna todavía pide la versión vulnerable, se fuerza la versión corregida en `overrides` de `pnpm-workspace.yaml`:

| Paquete | Versión forzada | Motivo | Desde |
| --- | --- | --- | --- |
| `shell-quote` | `>=1.11.0` | Aviso de seguridad en versiones anteriores. | — |
| `source-map-js` | `>=1.2.2` | Aviso de seguridad en versiones anteriores. | — |
| `node-forge` | `>=1.4.1` (queda en 1.4.2) | Siete avisos altos publicados en octubre de 2026 (GHSA-7wch-p9px-956x, GHSA-jc66-7q78-782g, GHSA-8hrf-8g6f-7xwp, GHSA-hqq3-7jhf-c5jx, GHSA-5x38-2vff-x55p, entre otros). Lo usa `@expo/cli` (firma de código y certificados); 1.4.1 es la primera versión corregida. | 31/10/2026 |

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
