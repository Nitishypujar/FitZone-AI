# FITZONE AI - ARCHITECTURE DECISIONS

## ADR-001 - Adaptive intelligence is the core differentiator
FitZone AI should adapt recommendations based on user state, behavior, performance and feedback rather than functioning as only a chatbot.

## ADR-002 - Recommendation is separate from workout completion
A user accepting or marking a recommendation complete does not mean the underlying workout was actually completed.

## ADR-003 - Actual workout completion is authoritative
workouts.completed, workouts.completed_at and workout_logs represent actual workout execution.

## ADR-004 - Rules plus ML before reinforcement learning
Use deterministic rules and supervised/contextual recommendation ranking before considering contextual bandits or reinforcement learning.

## ADR-005 - Gemini is the primary LLM
Gemini is used for natural-language reasoning and assistant behavior while deterministic tools and structured application data remain authoritative.

## ADR-006 - Heavy ML/CV training uses cloud compute
Local development hardware is not suitable for heavy model training.
Colab/Kaggle should be used for training when required.

## ADR-007 - GitHub is the source of truth for project code
Every stable milestone should be committed and pushed.

## ADR-008 - Project checkpoint files preserve project continuity
PROJECT_STATE.md and PROJECT_CHECKPOINT.md preserve the project state independently of any ChatGPT conversation.
