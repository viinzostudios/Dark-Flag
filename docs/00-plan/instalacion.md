# Instalación del entorno de desarrollo

> Todo lo que debes tener instalado en tu PC antes de tocar código.
> Versiones fijas — no usar versiones superiores sin actualizar este documento.

---

## Checklist de instalación

- [ ] Node.js 22 LTS
- [ ] Angular CLI 18
- [ ] NestJS CLI
- [ ] Docker Desktop
- [ ] Git
- [ ] VSCode + extensiones
- [ ] Verificar todo con los comandos de comprobación

---

## 1. Node.js 22 LTS

**Por qué**: Runtime del backend (NestJS) y herramientas de build del frontend (Angular).

**Instalación**:
- Descargar desde: https://nodejs.org (elegir "22.x LTS")
- Recomendado usar **nvm-windows** para gestionar versiones: https://github.com/coreybutler/nvm-windows

Con nvm-windows:
```powershell
nvm install 22
nvm use 22
```

**Verificar**:
```powershell
node --version    # debe mostrar v22.x.x
npm --version     # debe mostrar 10.x.x o superior
```

---

## 2. Angular CLI 19

**Por qué**: Herramienta para crear y gestionar el proyecto Angular (frontend).

```powershell
npm install -g @angular/cli@19
```

**Verificar**:
```powershell
ng version
# debe mostrar: Angular CLI: 19.x.x
```

---

## 3. NestJS CLI

**Por qué**: Herramienta para crear y gestionar proyectos NestJS (backend API y game server).

```powershell
npm install -g @nestjs/cli
```

**Verificar**:
```powershell
nest --version
# debe mostrar: 10.x.x o superior
```

---

## 4. Docker Desktop

**Por qué**: Corre PostgreSQL, Redis y Nginx en contenedores sin instalarlos directamente en la PC. Requerido para `docker compose`.

**Instalación**:
- Descargar desde: https://www.docker.com/products/docker-desktop/
- Instalar y abrir Docker Desktop al menos una vez para que complete su configuración
- Asegurarse de que WSL 2 esté habilitado (Docker Desktop lo solicita automáticamente en Windows)

**Verificar**:
```powershell
docker --version
# Docker version 27.x.x o superior

docker compose version
# Docker Compose version v2.x.x
```

> **Importante**: Docker Desktop debe estar corriendo (ícono en la barra de tareas) antes de ejecutar cualquier comando `docker compose`.

---

## 5. Git

**Por qué**: Control de versiones. Requerido para GitHub Actions (CI/CD).

**Instalación**:
- Descargar desde: https://git-scm.com/download/win

**Configuración inicial** (reemplazar con tus datos):
```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "viinzostudios@gmail.com"
git config --global core.autocrlf true   # importante en Windows
```

**Verificar**:
```powershell
git --version
# git version 2.x.x
```

---

## 6. VSCode + Extensiones recomendadas

**Por qué**: IDE principal del proyecto.

**Instalación**:
- Descargar desde: https://code.visualstudio.com/

**Extensiones requeridas** (instalar desde VSCode o desde terminal):

```powershell
# Angular
code --install-extension Angular.ng-template

# TypeScript / JavaScript
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode

# Docker
code --install-extension ms-azuretools.vscode-docker

# PostgreSQL
code --install-extension ckolkman.vscode-postgres

# NestJS (snippets)
code --install-extension ashinzekene.nestjs

# GitLens (historial visual)
code --install-extension eamodio.gitlens

# REST Client (probar APIs sin Postman)
code --install-extension humao.rest-client
```

---

## 7. Postman (opcional pero recomendado)

**Por qué**: Probar endpoints REST de la API durante el desarrollo.

- Descargar desde: https://www.postman.com/downloads/

---

## 8. TablePlus o DBeaver (opcional)

**Por qué**: Visualizar y editar la base de datos PostgreSQL con GUI.

- TablePlus: https://tableplus.com/ (mejor UX, versión gratuita suficiente)
- DBeaver: https://dbeaver.io/ (gratuito y open source)

---

## 9. Redis Insight (opcional)

**Por qué**: Visualizar las claves de Redis durante el desarrollo.

- Descargar desde: https://redis.com/redis-enterprise/redis-insight/

---

## Verificación completa del entorno

Ejecutar este script para verificar todo de una vez:

```powershell
Write-Host "=== Verificando entorno Arena Siege Tanks ===" -ForegroundColor Cyan

Write-Host "`n[Node.js]"
node --version

Write-Host "`n[npm]"
npm --version

Write-Host "`n[Angular CLI]"
ng version --skip-git 2>$null | Select-String "Angular CLI"

Write-Host "`n[NestJS CLI]"
nest --version

Write-Host "`n[Docker]"
docker --version

Write-Host "`n[Docker Compose]"
docker compose version

Write-Host "`n[Git]"
git --version

Write-Host "`n=== Verificación completa ===" -ForegroundColor Green
```

---

## Solución de problemas comunes

### "ng: command not found" después de instalar Angular CLI
```powershell
# Reiniciar PowerShell como Administrador, luego:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Docker no arranca en Windows
- Verificar que Hyper-V y WSL 2 estén habilitados en Windows Features
- Reiniciar la PC después de instalar Docker Desktop

### Puerto ocupado al levantar servicios
```powershell
# Ver qué proceso usa un puerto (ej: 5432 de PostgreSQL)
netstat -ano | findstr :5432
# Terminar el proceso con el PID obtenido
taskkill /PID [número] /F
```
