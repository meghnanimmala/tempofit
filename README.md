# TempoFit

TempoFit is a Spotify-integrated workout playlist generator that creates personalized playlists based on workout type, intensity, duration, and music preferences.

## Project Goal

TempoFit was created as a portfolio project to explore product management, system design, API integrations, OAuth 2.0, and full-stack development.

## Core User Flow

1. Connect a Spotify account
2. Select music preferences
3. Describe a workout in natural language
4. Enter workout duration
5. TempoFit converts the workout into structured parameters
6. Generate and preview a personalized playlist
7. Save the playlist to Spotify

## MVP Features

- Spotify OAuth authentication
- Natural-language workout input
- Workout intensity and type interpretation
- Warm-up, main workout, and cooldown playlist phases
- Personalized track selection
- Playlist duration matching
- Spotify playlist creation

## Technical Architecture

TempoFit uses a Next.js web application with server-side logic for Spotify integration and playlist generation.

Workout descriptions are converted into a structured `WorkoutProfile`, which is passed through a playlist generation pipeline:

Workout Input → Workout Parser → WorkoutProfile → Workout Phase Generator → Candidate Track Retrieval → Track Ranking → Duration Matcher → Spotify Playlist

User music preferences are stored locally in the browser to keep the MVP architecture lightweight.

## Planned Tech Stack

- Next.js
- JavaScript / TypeScript
- Spotify Web API
- OAuth 2.0
- Browser Storage
- Git / GitHub
- Figma
- Jira / Confluence

## Project Status

**Sprint 0 — Planning & Design**

Completed:
- MVP scope and requirements
- Product Requirements Document (PRD)
- User flow
- Low-fidelity interactive prototype
- System architecture
- Spotify Web API feasibility validation
- GitHub repository setup

Development is the next phase.
