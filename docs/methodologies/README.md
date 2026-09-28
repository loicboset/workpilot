# Methodologies

Every WorkPilot feature that applies a known method is documented here (ADR 0014).
The app shows this content behind an info icon next to the feature.

Each file starts with front matter that the app reads:

```yaml
id: hoshin-kanri            # stable id used by the app
name: Hoshin Kanri
origin: Toyota / lean management, 1960s
used_in: [direction]         # app features that use it
evidence: practice           # research | mixed | practice
adapted: true                # true if WorkPilot changes the original method
sources:
  - https://...
```

Then plain sections: **What it is**, **How WorkPilot applies it**, **What we adapted**.
Translations of this content go through the app's i18n system, not separate files.

| Method | Used in |
|---|---|
| [Hoshin Kanri](hoshin-kanri.md) | Direction |
| [ICE scoring](ice-scoring.md) | Opportunities |
| [Opportunity Solution Tree](opportunity-solution-tree.md) | Opportunities |
| [Practice testing](practice-testing.md) | Learning |
| [Spaced repetition (FSRS)](spaced-repetition-fsrs.md) | Learning |
