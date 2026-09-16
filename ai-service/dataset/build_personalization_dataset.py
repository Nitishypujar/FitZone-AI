import argparse
import csv
import json
from pathlib import Path


ACTIONS = [
    "recovery",
    "short-easy-workout",
    "complete-planned-workout",
    "progress-workout",
    "improve-protein-intake",
    "follow-planned-workout",
]


COLUMNS = [
    "user_id",
    "age",
    "weight_kg",
    "height_cm",
    "workout_days_per_week",
    "preferred_workout_duration",
    "fitness_level",
    "primary_goal",
    "adherence_percentage",
    "weekly_workout_progress",
    "weekly_minute_progress",
    "recent_sessions",
    "recent_active_minutes",
    "nutrition_available",
    "calorie_percentage",
    "protein_percentage",
    "recommendation_action",
    "accepted",
    "completed",
    "difficulty_feedback",
    "outcome_score",
    "generated_at",
    "outcome_recorded_at",
    "completion_label",
]


def safe_number(value, default=0.0):
    try:
        number = float(value)

        if number != number:
            return default

        return number

    except (TypeError, ValueError):
        return default


def safe_bool(value):
    if value is True:
        return 1

    if value is False:
        return 0

    return None


def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def parse_snapshot(snapshot):
    if snapshot is None:
        return None

    if isinstance(snapshot, str):
        try:
            snapshot = json.loads(snapshot)

        except json.JSONDecodeError:
            return None

    if not isinstance(snapshot, dict):
        return None

    return snapshot


def extract_features(event):
    snapshot = parse_snapshot(
        event.get("context_snapshot")
    )

    if not snapshot:
        return None

    profile = snapshot.get("profile") or {}
    goal_state = snapshot.get("goal_state") or {}
    workout_state = snapshot.get("workout_state") or {}
    nutrition_state = snapshot.get("nutrition_state") or {}

    training_load = (
        workout_state.get("recent_training_load")
        or {}
    )

    nutrition_available = (
        nutrition_state.get("available") is True
    )

    features = {
        "user_id": event.get("user_id"),

        "age": safe_number(
            profile.get("age")
        ),

        "weight_kg": safe_number(
            profile.get("weight_kg")
        ),

        "height_cm": safe_number(
            profile.get("height_cm")
        ),

        "workout_days_per_week": safe_number(
            profile.get("workout_days_per_week")
        ),

        "preferred_workout_duration": safe_number(
            profile.get(
                "preferred_workout_duration"
            )
        ),

        "fitness_level": profile.get(
            "fitness_level",
            "Beginner"
        ),

        "primary_goal": profile.get(
            "primary_goal",
            "Improve Fitness"
        ),

        "adherence_percentage": clamp(
            safe_number(
                workout_state.get(
                    "adherence_percentage"
                )
            ),
            0,
            100,
        ),

        "weekly_workout_progress": clamp(
            safe_number(
                goal_state.get(
                    "weekly_workout_progress"
                )
            ),
            0,
            200,
        ),

        "weekly_minute_progress": clamp(
            safe_number(
                goal_state.get(
                    "weekly_active_minute_progress"
                )
            ),
            0,
            200,
        ),

        "recent_sessions": safe_number(
            training_load.get("sessions")
        ),

        "recent_active_minutes": safe_number(
            training_load.get("active_minutes")
        ),

        "nutrition_available": int(
            nutrition_available
        ),

        "calorie_percentage": (
            clamp(
                safe_number(
                    nutrition_state.get(
                        "calorie_percentage"
                    )
                ),
                0,
                200,
            )
            if nutrition_available
            else None
        ),

        "protein_percentage": (
            clamp(
                safe_number(
                    nutrition_state.get(
                        "protein_percentage"
                    )
                ),
                0,
                200,
            )
            if nutrition_available
            else None
        ),

        "recommendation_action": (
            event.get(
                "recommendation_action"
            )
            or event.get(
                "recommendation_type"
            )
        ),

        "accepted": safe_bool(
            event.get("accepted")
        ),

        "completed": safe_bool(
            event.get("completed")
        ),

        "difficulty_feedback": (
            safe_number(
                event.get(
                    "difficulty_feedback"
                )
            )
            if event.get(
                "difficulty_feedback"
            ) is not None
            else None
        ),

        "outcome_score": (
            safe_number(
                event.get(
                    "outcome_score"
                )
            )
            if event.get(
                "outcome_score"
            ) is not None
            else None
        ),

        "generated_at": event.get(
            "generated_at"
        ),

        "outcome_recorded_at": event.get(
            "outcome_recorded_at"
        ),
    }

    return features


def build_dataset(events):
    rows = []

    skipped_pending = 0
    skipped_context = 0
    skipped_action = 0

    for event in events:

        if not isinstance(event, dict):
            continue

        completed = event.get("completed")

        # Pending recommendations are not training examples.
        if completed is None:
            skipped_pending += 1
            continue

        features = extract_features(event)

        if features is None:
            skipped_context += 1
            continue

        action = features[
            "recommendation_action"
        ]

        if action not in ACTIONS:
            skipped_action += 1
            continue

        # Primary supervised-learning target.
        features["completion_label"] = (
            1 if completed is True else 0
        )

        rows.append(features)

    print()
    print("Dataset filtering:")
    print("------------------")
    print(
        f"Pending events skipped: {skipped_pending}"
    )
    print(
        f"Missing context skipped: {skipped_context}"
    )
    print(
        f"Unsupported actions skipped: {skipped_action}"
    )

    return rows


def load_events(input_path):
    input_path = Path(input_path)

    with input_path.open(
        "r",
        encoding="utf-8"
    ) as file:
        data = json.load(file)

    if isinstance(data, dict):

        if isinstance(
            data.get("data"),
            list
        ):
            return data["data"]

        if isinstance(
            data.get("events"),
            list
        ):
            return data["events"]

    if isinstance(data, list):
        return data

    raise ValueError(
        "Input JSON must contain a list of events."
    )


def validate_dataset(rows):
    for row in rows:

        for column in COLUMNS:
            if column not in row:
                raise ValueError(
                    f"Missing required column: {column}"
                )

        if row["completion_label"] not in [0, 1]:
            raise ValueError(
                "completion_label must be 0 or 1"
            )

        if (
            row["recommendation_action"]
            not in ACTIONS
        ):
            raise ValueError(
                "Unsupported recommendation action."
            )

        if row["completed"] is None:
            raise ValueError(
                "Pending event found in dataset."
            )


def save_csv(rows, output_path):
    output_path = Path(output_path)

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with output_path.open(
        "w",
        newline="",
        encoding="utf-8"
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=COLUMNS
        )

        writer.writeheader()
        writer.writerows(rows)


def print_summary(rows):
    print()
    print("FitZone AI Personalization Dataset")
    print("==================================")
    print(
        f"Rows: {len(rows)}"
    )
    print(
        f"Columns: {len(COLUMNS)}"
    )

    if not rows:
        print()
        print(
            "No eligible training rows found."
        )
        return

    actions = {}

    completed_count = 0
    users = set()

    for row in rows:

        action = row[
            "recommendation_action"
        ]

        actions[action] = (
            actions.get(action, 0) + 1
        )

        if row["completion_label"] == 1:
            completed_count += 1

        if row["user_id"]:
            users.add(row["user_id"])

    print()
    print("Actions:")

    for action, count in actions.items():
        print(
            f"  {action}: {count}"
        )

    completion_rate = (
        completed_count / len(rows)
    ) * 100

    print()
    print(
        f"Completion rate: "
        f"{completion_rate:.2f}%"
    )

    print(
        f"Users: {len(users)}"
    )

    print()
    print("Target distribution:")
    print(
        f"  0 (not completed): "
        f"{len(rows) - completed_count}"
    )
    print(
        f"  1 (completed): "
        f"{completed_count}"
    )


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Build the FitZone AI "
            "personalization dataset."
        )
    )

    parser.add_argument(
        "--input",
        required=True,
        help=(
            "Path to recommendation "
            "events JSON."
        ),
    )

    parser.add_argument(
        "--output",
        default=(
            "ai-service/dataset/"
            "personalization_dataset.csv"
        ),
        help="Output CSV path.",
    )

    args = parser.parse_args()

    events = load_events(
        args.input
    )

    rows = build_dataset(
        events
    )

    validate_dataset(
        rows
    )

    save_csv(
        rows,
        args.output
    )

    print_summary(
        rows
    )

    print()
    print(
        f"Saved dataset: {args.output}"
    )


if __name__ == "__main__":
    main()