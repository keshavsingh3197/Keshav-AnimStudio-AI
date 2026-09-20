# Contributing to AnimStudio AI

Thank you for your interest in contributing to **AnimStudio AI**! Whether you are fixing a bug, adding new features, improving the documentation, or participating in **Hacktoberfest**, we welcome your contributions.

---

## 🎃 Hacktoberfest Welcome!

AnimStudio AI participates in **Hacktoberfest** and is open to the open-source community!

- Look for issues labeled [`good first issue`](https://github.com/keshavsingh3197/Keshav-AnimStudio-AI/labels/good%20first%20issue) or [`hacktoberfest`](https://github.com/keshavsingh3197/Keshav-AnimStudio-AI/labels/hacktoberfest).
- Submissions must be meaningful, functional, and adhere to our coding standards.
- Low-effort PRs (e.g. whitespace edits, trivial renamings) will not be accepted.

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please treat fellow contributors with respect, patience, and empathy.

---

## How to Get Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **.NET 10.0 SDK** (the backend projects target `net10.0`).
- **Node.js 22 LTS** & **npm** (for Angular frontend).
- **FFmpeg 6.0+** (with `libass` and `libx264`).
- **MongoDB** (6.0+) or **SQL Server** (2019+).
- **Git**.

For detailed installation commands per OS (Windows, macOS, Linux), refer to [docs/SETUP.md](docs/SETUP.md).

### 2. Fork and Clone
1. Fork the repository on GitHub: `https://github.com/keshavsingh3197/Keshav-AnimStudio-AI`
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/Keshav-AnimStudio-AI.git
   cd Keshav-AnimStudio-AI
   ```
3. Set up upstream remote:
   ```bash
   git remote add upstream https://github.com/keshavsingh3197/Keshav-AnimStudio-AI.git
   ```

### 3. Create a Feature Branch
Always create a branch off the latest `master`:
```bash
git checkout master
git pull upstream master
git checkout -b feat/your-feature-name
```
Branch naming conventions:
- `feat/<description>` — New feature or enhancement
- `fix/<description>` — Bug fix
- `docs/<description>` — Documentation improvements
- `refactor/<description>` — Code refactoring or cleanup
- `test/<description>` — Adding or improving tests

---

## Local Development Workflow

### Running the App
- **Windows (All-in-one)**: Run `run.bat` to launch both backend and frontend in Windows Terminal.
- **Backend**:
  ```bash
  cd backend/AnimStudio.Api
  dotnet run
  ```
  API runs on `http://localhost:5000` (or `https://localhost:5001`).
- **Frontend**:
  ```bash
  cd frontend
  npm install
  npm start
  ```
  UI runs on `http://localhost:4200`.

### Running Tests
Before submitting a PR, verify all tests pass:
```bash
# Backend unit & integration tests:
dotnet test

# Frontend build check:
cd frontend
npm run build
```

---

## Coding Standards

### Backend (.NET 10 / C#)
- Follow standard [C# Coding Conventions](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions).
- Prefer modern C# features (pattern matching, records, primary constructors, file-scoped namespaces).
- Keep domain logic clean and decoupled from infrastructure and presentation layers.
- **Never commit secrets, tokens, or live connection strings** into `appsettings.json` or source code. Use `dotnet user-secrets` or environment variables.

### Frontend (Angular 22)
- Use **standalone components** (no NgModules).
- Use Angular **Signals** (`signal()`, `computed()`) for reactive state management.
- Keep components modular, accessible, and responsive.
- Ensure the bundle builds cleanly with zero TypeScript errors (`npm run build`).

---

## Submitting a Pull Request

1. **Keep PRs focused**: Each PR should address a single bug or feature.
2. **Commit Messages**: Write clear, descriptive commit messages following Conventional Commits (e.g., `feat(studio): add audio track waveform zoom`, `fix(renderer): handle missing watermark font gracefully`).
3. **Push to Your Fork**:
   ```bash
   git push origin feat/your-feature-name
   ```
4. **Open a PR**: Open a Pull Request against `master` of `keshavsingh3197/Keshav-AnimStudio-AI`.
5. **Fill out the PR Template**: Describe what changes were made, why, and how you tested them.

---

## Areas Where You Can Help!

- 🎨 **UI / UX**: Enhancements to the Timeline, Media Library, transition previews, and responsive layouts.
- ⚡ **AI Providers**: Adding new provider integrations (e.g., ElevenLabs, Replicate, Fal.ai).
- 🎬 **FFmpeg Filter Graphs**: New transition types, video filters, animated text styles, and color presets.
- 🧪 **Tests**: Additional unit and integration test coverage for rendering pipelines and UI components.
- 📖 **Documentation & Tutorials**: Improving setup guides, API specs, and feature walkthroughs.

Thank you for helping make AnimStudio AI better! 🚀
