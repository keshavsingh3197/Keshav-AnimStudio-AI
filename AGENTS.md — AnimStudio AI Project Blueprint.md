# AGENTS.md

# AnimStudio AI — AI Animated Video Studio

## Project Instructions for AI Coding Agents

This document defines the architecture, rules, development strategy, technology choices, coding standards, and implementation roadmap for the **AnimStudio AI** project.

All AI coding agents working on this repository MUST follow these instructions.

---

# 1. PROJECT OVERVIEW

## Project Name

**AnimStudio AI**

## Primary Goal

Build a local-first web application that allows users to:

- Create animated video projects
- Create and manage characters
- Create scenes
- Upload images
- Upload audio
- Upload videos
- Add dialogue
- Add subtitles
- Add background music
- Create basic animations
- Render scenes into videos
- Merge scenes into a final video
- Download the final rendered video

The first version MUST work completely **without AI services**.

AI functionality must be designed as optional integrations that can be enabled later using API keys.

---

# 2. CORE DEVELOPMENT PHILOSOPHY

Follow this principle:

```text
FIRST:
Build a complete working video editor without AI.

THEN:
Add AI as an enhancement layer.
```

The application MUST NOT depend on AI services for its basic functionality.

The following features must work without any AI API key:

- Project creation
- Character creation
- Scene creation
- Asset uploads
- Audio uploads
- Image uploads
- Scene configuration
- Basic animation effects
- Video rendering
- Scene merging
- Subtitle generation from manually entered text
- Final MP4 export

---

# 3. TECHNOLOGY STACK

## Backend

```text
.NET 10
ASP.NET Core Web API
C#
MongoDB
MongoDB.Driver
BackgroundService
FFmpeg
Swagger / OpenAPI
```

---

## Frontend

Use the latest stable Angular version compatible with the project environment.

```text
Angular
TypeScript
Angular Signals
RxJS
Angular Router
Angular HttpClient
Angular Material
```

Optional later:

```text
Tailwind CSS
```

Do not mix multiple UI libraries unnecessarily.

Prefer Angular Material initially.

---

## Database

Use:

```text
MongoDB
```

Database name:

```text
AnimStudioDb
```

---

## Local Storage

Use the local file system.

Root folder:

```text
storage/
```

Structure:

```text
storage/

├── uploads/
│   ├── images/
│   ├── audio/
│   └── videos/
│
├── projects/
│   └── {projectId}/
│       ├── characters/
│       ├── scenes/
│       └── assets/
│
├── renders/
│
└── temp/
```

Do NOT use Azure Blob Storage initially.

Create an abstraction so cloud storage can be added later.

---

# 4. LOCAL-FIRST ARCHITECTURE

The application must run locally.

Architecture:

```text
┌───────────────────────────────┐
│                               │
│      Angular Frontend         │
│                               │
│         localhost             │
│                               │
└───────────────┬───────────────┘
                │
                │ HTTP
                ▼
┌───────────────────────────────┐
│                               │
│       .NET 10 Web API         │
│                               │
│       ASP.NET Core            │
│                               │
└───────────────┬───────────────┘
                │
        ┌───────┼────────┐
        │       │        │
        ▼       ▼        ▼
    MongoDB  Storage  Background
                       Worker
                           │
                           ▼
                         FFmpeg
                           │
                           ▼
                      Final Video
```

No cloud infrastructure is required for Version 1.

---

# 5. DO NOT ADD THESE YET

The following technologies MUST NOT be introduced during the MVP unless explicitly requested:

```text
Azure Service Bus
Azure Functions
AKS
Kubernetes
Redis
Azure Blob Storage
Azure SQL
Microservices
RabbitMQ
Kafka
SignalR
Docker Swarm
Complex Event Architecture
```

The project must remain simple.

---

# 6. SOLUTION STRUCTURE

Create the backend solution:

```text
backend/

AnimStudio.sln

src/

├── AnimStudio.API/
│
├── AnimStudio.Application/
│
├── AnimStudio.Domain/
│
└── AnimStudio.Infrastructure/
```

Optional future project:

```text
AnimStudio.Worker/
```

For Version 1, background processing may run inside the API using:

```csharp
BackgroundService
```

Do not create unnecessary projects.

---

# 7. CLEAN ARCHITECTURE RULES

Dependencies must flow in this direction:

```text
API
 ↓
Application
 ↓
Domain

Infrastructure
 ↓
Application
```

The Domain project MUST NOT depend on:

```text
MongoDB
ASP.NET Core
FFmpeg
OpenAI
Angular
External APIs
```

---

# 8. DOMAIN MODELS

Create the following primary entities.

---

## Project

```text
Project

Id
Name
Description
Status
CreatedAt
UpdatedAt
Settings
```

Example:

```json
{
  "_id": "project-id",
  "name": "My Animated Story",
  "description": "My first animation project",
  "status": "Draft",
  "createdAt": "2026-09-04T00:00:00Z",
  "updatedAt": "2026-09-04T00:00:00Z"
}
```

---

# 9. CHARACTER MODEL

Each project can contain multiple characters.

```text
Character

Id
ProjectId
Name
Description

Appearance
 ├── Age
 ├── Gender
 ├── Hair
 ├── Clothes
 └── AdditionalDetails

ImagePath

VoiceSettings

CreatedAt
UpdatedAt
```

Example:

```json
{
  "_id": "character-id",
  "projectId": "project-id",
  "name": "Rahul",
  "description": "A friendly software engineer",
  "appearance": {
    "age": 25,
    "hair": "Black",
    "clothes": "Blue shirt"
  },
  "imagePath": "/storage/uploads/images/rahul.png"
}
```

---

# 10. SCENE MODEL

Each project can contain multiple scenes.

```text
Scene

Id
ProjectId
SceneNumber
Title
Description

Duration

Background

Characters[]

Dialogue[]

Audio

Transition

AnimationSettings

CreatedAt
UpdatedAt
```

Example:

```json
{
  "_id": "scene-id",
  "projectId": "project-id",
  "sceneNumber": 1,
  "title": "Rahul in the Park",
  "description": "Rahul walks through a park",
  "duration": 10,
  "transition": "Fade"
}
```

---

# 11. ASSET MODEL

Assets include:

```text
Images
Videos
Audio
Background Music
Character Images
```

Model:

```text
Asset

Id
ProjectId
Name
FileName
FileType
MimeType
FilePath
FileSize
CreatedAt
```

Supported types initially:

```text
image/png
image/jpeg
image/webp

audio/mp3
audio/wav

video/mp4
```

---

# 12. VIDEO JOB MODEL

Video generation can take time.

Use a job system.

```text
VideoJob

Id
ProjectId
Status
Progress
Message

CreatedAt
StartedAt
CompletedAt

ErrorMessage

OutputPath
```

Statuses:

```text
Pending
Processing
Completed
Failed
Cancelled
```

Example:

```json
{
  "_id": "job-id",
  "projectId": "project-id",
  "status": "Processing",
  "progress": 65,
  "message": "Rendering Scene 4 of 8"
}
```

---

# 13. BACKGROUND PROCESSING

Use:

```csharp
BackgroundService
```

Initial workflow:

```text
User clicks Render

        ↓

POST /api/projects/{id}/render

        ↓

Create VideoJob

Status = Pending

        ↓

BackgroundService checks pending jobs

        ↓

Status = Processing

        ↓

FFmpeg renders scenes

        ↓

Update Progress

        ↓

Merge scenes

        ↓

Status = Completed
```

The worker must process jobs safely.

Avoid processing the same job twice.

---

# 14. JOB QUEUE STRATEGY

For Version 1:

Use MongoDB as the job source.

The worker should:

1. Find pending jobs.
2. Atomically claim one job.
3. Change status to Processing.
4. Process the job.
5. Update progress.
6. Mark Completed or Failed.

Do NOT add Redis, RabbitMQ, or Azure Service Bus.

---

# 15. FRONTEND STATUS UPDATES

Do NOT use SignalR initially.

Use HTTP polling.

Example:

```text
GET /api/video-jobs/{jobId}
```

Angular checks every:

```text
2–3 seconds
```

Example response:

```json
{
  "status": "Processing",
  "progress": 65,
  "message": "Rendering Scene 4 of 8"
}
```

Stop polling when:

```text
Completed
Failed
Cancelled
```

SignalR may be added later.

---

# 16. FFMPEG INTEGRATION

FFmpeg is the main local video rendering engine.

The backend must interact with FFmpeg through an abstraction.

Create:

```csharp
IVideoRenderingService
```

Example:

```csharp
public interface IVideoRenderingService
{
    Task<RenderResult> RenderSceneAsync(
        SceneRenderRequest request,
        CancellationToken cancellationToken);

    Task<RenderResult> MergeVideosAsync(
        IReadOnlyCollection<string> videoPaths,
        string outputPath,
        CancellationToken cancellationToken);
}
```

Implementation:

```text
FfmpegVideoRenderingService
```

---

# 17. BASIC ANIMATION FEATURES

Version 1 must support simple animations without AI.

Implement:

```text
Fade In
Fade Out

Zoom In
Zoom Out

Pan Left
Pan Right

Slide Left
Slide Right

Image Duration

Transitions
```

Use FFmpeg filters.

Do not build a complex custom animation engine initially.

---

# 18. VIDEO RENDERING PIPELINE

The pipeline:

```text
Project

    ↓

Load Scenes

    ↓

Sort by SceneNumber

    ↓

Render Scene 1

    ↓

Render Scene 2

    ↓

Render Scene 3

    ↓

Add Audio

    ↓

Add Subtitles

    ↓

Apply Transitions

    ↓

Merge Videos

    ↓

Final MP4
```

Temporary files must be stored in:

```text
storage/temp/
```

Final videos must be stored in:

```text
storage/renders/
```

---

# 19. API DESIGN

Use REST APIs.

Base route:

```text
/api
```

---

## Projects

```text
GET    /api/projects

GET    /api/projects/{id}

POST   /api/projects

PUT    /api/projects/{id}

DELETE /api/projects/{id}
```

---

## Characters

```text
GET    /api/projects/{projectId}/characters

GET    /api/characters/{id}

POST   /api/projects/{projectId}/characters

PUT    /api/characters/{id}

DELETE /api/characters/{id}
```

---

## Scenes

```text
GET    /api/projects/{projectId}/scenes

POST   /api/projects/{projectId}/scenes

PUT    /api/scenes/{id}

DELETE /api/scenes/{id}
```

---

## Assets

```text
POST /api/projects/{projectId}/assets

GET /api/projects/{projectId}/assets

DELETE /api/assets/{id}
```

---

## Rendering

```text
POST /api/projects/{projectId}/render

GET /api/video-jobs/{jobId}

GET /api/video-jobs/{jobId}/download
```

---

# 20. API RESPONSE FORMAT

Use consistent responses.

Success:

```json
{
  "success": true,
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "message": "Something went wrong",
  "errors": []
}
```

Use proper HTTP status codes.

---

# 21. ANGULAR APPLICATION STRUCTURE

Create:

```text
frontend/

src/app/

├── core/
│   ├── services/
│   ├── interceptors/
│   └── models/
│
├── shared/
│   ├── components/
│   └── utilities/
│
├── features/
│   │
│   ├── projects/
│   │
│   ├── characters/
│   │
│   ├── scenes/
│   │
│   ├── assets/
│   │
│   └── rendering/
│
├── layouts/
│
└── app.routes.ts
```

Prefer standalone Angular components.

Use lazy loading for feature areas.

---

# 22. FRONTEND PAGES

Create the following pages.

---

## Dashboard

```text
/projects
```

Features:

```text
Create Project
View Projects
Delete Project
Edit Project
```

---

## Project Editor

```text
/projects/{id}
```

Layout:

```text
┌──────────────────────────────────────────────┐
│ Project Name                    [Render]     │
├──────────────┬───────────────────────────────┤
│              │                               │
│ Characters   │        Scene Editor           │
│ Scenes       │                               │
│ Assets       │        Preview Area           │
│ Audio        │                               │
│              │                               │
└──────────────┴───────────────────────────────┘
```

---

## Character Manager

Features:

```text
Create Character

Edit Character

Upload Image

Delete Character
```

---

## Scene Editor

Features:

```text
Create Scene

Reorder Scene

Set Duration

Add Background

Add Character

Add Dialogue

Add Audio

Select Transition

Select Animation
```

---

## Asset Library

Features:

```text
Upload Files

Images

Audio

Videos

Delete Assets
```

---

## Render Page

Features:

```text
Render Progress

Current Scene

Status

Error Message

Final Video Preview

Download Video
```

---

# 23. AI ARCHITECTURE

AI is OPTIONAL.

The application must work without AI.

Create interfaces only.

---

## Story AI Provider

```csharp
public interface IStoryAiProvider
{
    Task<StoryAnalysisResult> AnalyzeAsync(
        StoryAnalysisRequest request,
        CancellationToken cancellationToken);
}
```

Responsibilities:

```text
Transcript Analysis

Character Extraction

Scene Generation

Dialogue Suggestions

Prompt Generation
```

---

## Image Generation Provider

```csharp
public interface IImageGenerationProvider
{
    Task<ImageGenerationResult> GenerateAsync(
        ImageGenerationRequest request,
        CancellationToken cancellationToken);
}
```

---

## Video Generation Provider

```csharp
public interface IVideoGenerationProvider
{
    Task<VideoGenerationResult> GenerateAsync(
        VideoGenerationRequest request,
        CancellationToken cancellationToken);
}
```

---

# 24. AI PROVIDER IMPLEMENTATION

Do NOT directly call AI APIs from controllers.

Correct architecture:

```text
Controller

    ↓

Application Service

    ↓

Interface

    ↓

Provider Implementation

    ↓

External AI API
```

Example:

```text
IStoryAiProvider

    ├── OpenAiStoryProvider
    │
    ├── FutureProvider
    │
    └── LocalAiProvider
```

Providers must be replaceable through configuration.

---

# 25. AI CONFIGURATION

Never hardcode API keys.

Use:

```text
User Secrets
```

Example configuration:

```json
{
  "Ai": {
    "Provider": "None"
  }
}
```

Later:

```json
{
  "Ai": {
    "Provider": "OpenAI"
  }
}
```

Secrets must NOT be committed to Git.

---

# 26. CONFIGURATION RULES

Use:

```text
appsettings.json
```

For non-sensitive configuration.

Use:

```text
dotnet user-secrets
```

For:

```text
API Keys
Passwords
Connection Secrets
```

Never commit:

```text
API keys
Passwords
Secrets
```

---

# 27. MONGODB CONFIGURATION

Create:

```text
MongoDbSettings

ConnectionString
DatabaseName
```

Example:

```json
{
  "MongoDb": {
    "ConnectionString": "mongodb://localhost:27017",
    "DatabaseName": "AnimStudioDb"
  }
}
```

Use strongly typed options.

---

# 28. MONGODB COLLECTIONS

Use separate collections:

```text
projects

characters

scenes

assets

videoJobs
```

Do not create an unnecessarily complex relational structure.

Use references through IDs where appropriate.

---

# 29. FILE STORAGE ABSTRACTION

Create:

```csharp
IFileStorageService
```

Methods:

```text
Upload

Download

Delete

GetPath
```

Implementation:

```text
LocalFileStorageService
```

Future:

```text
AzureBlobStorageService
```

The application layer must not depend directly on physical disk paths.

---

# 30. ERROR HANDLING

Use global exception handling.

Create:

```text
GlobalExceptionHandler
```

Log:

```text
Errors

Warnings

Rendering failures

FFmpeg output
```

Do not expose internal exception details to users.

---

# 31. LOGGING

Use built-in:

```text
ILogger
```

Initially.

Do not add expensive logging platforms.

Later possible:

```text
Serilog
Seq
Application Insights
```

---

# 32. VALIDATION

Validate:

```text
Project Name

Scene Duration

File Size

File Type

Video Format

Audio Format
```

Do validation on:

```text
Frontend

AND

Backend
```

Backend validation is mandatory.

---

# 33. FILE SECURITY

Never trust uploaded file names.

Generate unique names:

```text
Guid
```

Example:

```text
original:

character.png
```

Store:

```text
a9f2b8c4-1234-5678.png
```

Validate:

```text
Extension

MIME Type

File Size
```

---

# 34. DEVELOPMENT PHASES

---

## PHASE 1 — PROJECT FOUNDATION

Goal:

```text
Application starts successfully.
```

Tasks:

```text
Create repository

Create .NET 10 solution

Create Angular application

Configure MongoDB

Configure Swagger

Configure CORS

Create basic API

Create Angular layout
```

---

## PHASE 2 — PROJECT MANAGEMENT

Implement:

```text
Create Project

List Projects

Edit Project

Delete Project
```

---

## PHASE 3 — CHARACTER MANAGEMENT

Implement:

```text
Create Character

Edit Character

Delete Character

Upload Character Image
```

---

## PHASE 4 — ASSET MANAGEMENT

Implement:

```text
Upload Images

Upload Audio

Upload Videos

List Assets

Delete Assets
```

---

## PHASE 5 — SCENE MANAGEMENT

Implement:

```text
Create Scene

Edit Scene

Delete Scene

Reorder Scenes

Add Characters

Add Dialogue

Select Animation
```

---

## PHASE 6 — BASIC VIDEO RENDERING

Implement:

```text
FFmpeg Detection

Image → Video

Audio → Video

Basic Fade

Basic Zoom

Basic Pan
```

This phase must be completed before AI integration.

---

## PHASE 7 — JOB PROCESSING

Implement:

```text
VideoJob

BackgroundService

Progress Tracking

Angular Polling

Error Handling
```

---

## PHASE 8 — FINAL VIDEO

Implement:

```text
Render All Scenes

Merge Scenes

Add Music

Generate Final MP4

Preview Video

Download Video
```

---

## PHASE 9 — AI TEXT FEATURES

Optional.

Implement:

```text
Transcript Input

AI Character Extraction

AI Scene Creation

AI Prompt Generation
```

---

## PHASE 10 — AI VIDEO FEATURES

Optional.

Implement:

```text
Text → Image

Image → Video

Text → Video

AI Voice

Lip Sync
```

---

# 35. CODING RULES

All backend code must:

```text
Use async/await

Accept CancellationToken where appropriate

Use dependency injection

Avoid static service dependencies

Avoid business logic in controllers

Use clear naming

Use interfaces for external dependencies
```

Controllers should remain thin.

---

# 36. CONTROLLER RULE

Controllers must:

```text
Receive Request

Validate Request

Call Application Layer

Return Response
```

Controllers must NOT:

```text
Call MongoDB directly

Call FFmpeg directly

Contain business logic

Call AI APIs directly
```

---

# 37. GIT RULES

Do not commit:

```text
appsettings.Development.json with secrets

API keys

MongoDB credentials

Generated videos

Uploads

Temp files

node_modules

bin

obj
```

Create a proper:

```text
.gitignore
```

---

# 38. LOCAL DEVELOPMENT COMMANDS

Backend:

```bash
dotnet restore

dotnet build

dotnet run
```

Frontend:

```bash
npm install

ng serve
```

MongoDB:

```text
Must be running locally.
```

FFmpeg:

```bash
ffmpeg -version
```

must work from the terminal.

---

# 39. TESTING STRATEGY

Initially prioritize:

```text
Manual Testing

API Testing

Swagger Testing
```

Later add:

```text
Unit Tests

Integration Tests
```

Important areas:

```text
Project Management

Scene Ordering

File Upload

Video Job Processing

FFmpeg Rendering
```

---

# 40. PERFORMANCE RULES

Do not load entire video files into memory unnecessarily.

Use streaming where possible.

Delete temporary files after rendering.

Always clean:

```text
storage/temp/
```

after successful rendering.

Implement cleanup for failed jobs later.

---

# 41. FUTURE CLOUD MIGRATION

The architecture must allow this future migration:

```text
LOCAL VERSION

MongoDB Local
+
Local Storage
+
BackgroundService
+
FFmpeg

        ↓

CLOUD VERSION

MongoDB Atlas / Cloud Database
+
Blob Storage
+
Message Queue
+
Worker Containers
+
FFmpeg Containers
```

The business logic should require minimal changes.

---

# 42. FUTURE SIGNALR SUPPORT

Current:

```text
Angular
   ↓
Polling
   ↓
.NET API
```

Future:

```text
Angular
   ↕
SignalR
   ↕
.NET API
```

Do not build SignalR now.

Design job responses so it can be added later.

---

# 43. FUTURE AUTHENTICATION

Do not overcomplicate authentication in the first rendering prototype.

Future authentication:

```text
ASP.NET Core Identity

JWT

OAuth

Google Login
```

Keep domain models ready for:

```text
UserId
```

but authentication can be introduced after the core video pipeline works.

---

# 44. MVP SUCCESS CRITERIA

The MVP is successful when a user can:

```text
1. Open the application

2. Create a Project

3. Create Characters

4. Upload Images

5. Create Scenes

6. Add Images to Scenes

7. Add Audio

8. Select Basic Animation

9. Click Render

10. See Progress

11. Wait for Processing

12. Preview Final Video

13. Download MP4
```

ALL of the above must work without an AI API key.

---

# 45. DEVELOPMENT PRIORITY

Always follow this order:

```text
WORKING FEATURE
        ↓
CLEAN CODE
        ↓
GOOD ARCHITECTURE
        ↓
OPTIMIZATION
        ↓
ADVANCED FEATURES
        ↓
AI FEATURES
        ↓
CLOUD DEPLOYMENT
```

Never introduce complexity before it is needed.

---

# 46. IMPORTANT AI AGENT INSTRUCTIONS

When implementing this project:

1. Read this AGENTS.md first.
2. Do not introduce cloud infrastructure unless requested.
3. Do not introduce microservices.
4. Do not add Redis, RabbitMQ, Kafka, or Azure Service Bus.
5. Keep the application local-first.
6. Complete the current development phase before starting the next.
7. Do not add AI dependencies until the non-AI version works.
8. Prefer simple, maintainable solutions.
9. Do not rewrite unrelated working code.
10. Ask before making major architectural changes.
11. Build and test after each major implementation.
12. Fix compilation errors before continuing.
13. Keep controllers thin.
14. Keep external services behind interfaces.
15. Never hardcode secrets.

---

# 47. CURRENT DEVELOPMENT STATUS

Current Phase:

```text
PHASE 1 — PROJECT FOUNDATION
```

Current Goal:

```text
Create the complete local development environment.

.NET 10
+
Angular
+
MongoDB
+
FFmpeg
+
Basic API
+
Basic Frontend
```

DO NOT IMPLEMENT AI FEATURES YET.

---

# FINAL PROJECT PRINCIPLE

```text
THE APPLICATION MUST BE USEFUL WITHOUT AI.

AI SHOULD MAKE THE APPLICATION BETTER,
NOT BE REQUIRED FOR THE APPLICATION TO WORK.
```

---

# END OF AGENTS.md