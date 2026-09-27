import argparse
import csv
import random
from pathlib import Path


ACTIONS = [
    "recovery",
    "short-easy-workout",
    "complete-planned-workout",
    "progress-workout",
    "improve-protein-intake",
    "follow-planned-workout",
]


def clamp(value, minimum, maximum):
    return max(minimum, min(maximum, value))


def sigmoid(value):
    return 1.0 / (1.0 + pow(2.718281828, -value))


def action_score(action, features):
    adherence = features["adherence_percentage"]
    readiness = features["readiness_score"]
    weekly_progress = features["weekly_workout_progress"]
    recent_sessions = features["recent_sessions"]
    recent_minutes = features["recent_active_minutes"]
    difficulty = features["difficulty_preference"]

    score = -0.5

    if action == "recovery":
        score += (100 - readiness) * 0.035
        score += max(0, recent_sessions - 3) * 0.25
        score += max(0, recent_minutes - 150) * 0.008

    elif action == "short-easy-workout":
        score += (100 - adherence) * 0.025
        score += (70 - readiness) * 0.012
        score += max(0, 50 - weekly_progress) * 0.015
        score += difficulty * 0.01

    elif action == "complete-planned-workout":
        score += adherence * 0.018
        score += readiness * 0.015
        score += weekly_progress * 0.012

    elif action == "progress-workout":
        score += max(0, readiness - 65) * 0.035
        score += max(0, adherence - 65) * 0.02
        score += max(0, weekly_progress - 70) * 0.01

    elif action == "improve-protein-intake":
        protein = features["protein_percentage"]
        if protein < 70:
            score += (70 - protein) * 0.035
        score += 0.1 if features["nutrition_available"] else -0.6

    elif action == "follow-planned-workout":
        score += adherence * 0.015
        score += readiness * 0.01
        score += max(0, 60 - weekly_progress) * 0.01

    return score


def generate_row(rng, user_index, event_index):
    age = rng.randint(18, 55)
    weight = round(rng.uniform(50, 110), 1)
    height = round(rng.uniform(150, 195), 1)

    workout_days = rng.randint(2, 6)
    duration = rng.choice([20, 25, 30, 35, 40, 45, 60])

    adherence = round(rng.uniform(10, 100), 1)
    weekly_progress = round(rng.uniform(0, 130), 1)
    minute_progress = round(rng.uniform(0, 130), 1)

    recent_sessions = rng.randint(0, 7)
    recent_minutes = rng.randint(0, 420)

    nutrition_available = rng.random() < 0.75
    calorie_percentage = (
        round(rng.uniform(40, 140), 1)
        if nutrition_available
        else 0
    )
    protein_percentage = (
        round(rng.uniform(35, 140), 1)
        if nutrition_available
        else 0
    )

    readiness = 70

    if adherence < 40:
        readiness -= 15
    elif adherence >= 80:
        readiness += 10

    if recent_sessions >= 6 or recent_minutes >= 360:
        readiness -= 30
    elif recent_sessions >= 3 or recent_minutes >= 150:
        readiness -= 5

    readiness += rng.uniform(-8, 8)
    readiness = round(clamp(readiness, 20, 100), 1)

    difficulty_preference = rng.uniform(0, 10)

    fitness_level = rng.choice(
        ["Beginner", "Intermediate", "Advanced"]
    )

    primary_goal = rng.choice(
        [
            "Lose Weight",
            "Build Muscle",
            "Improve Fitness",
            "Improve Endurance",
            "Maintain Fitness",
        ]
    )

    action = rng.choice(ACTIONS)

    raw_score = action_score(
        action,
        {
            "adherence_percentage": adherence,
            "readiness_score": readiness,
            "weekly_workout_progress": weekly_progress,
            "recent_sessions": recent_sessions,
            "recent_active_minutes": recent_minutes,
            "protein_percentage": protein_percentage,
            "nutrition_available": nutrition_available,
            "difficulty_preference": difficulty_preference,
        },
    )

    completion_probability = sigmoid(raw_score)

    # Add realistic noise so the synthetic dataset is not deterministic.
    completion_probability = clamp(
        completion_probability + rng.uniform(-0.08, 0.08),
        0.05,
        0.95,
    )

    completed = 1 if rng.random() < completion_probability else 0

    return {
        "user_id": f"synthetic-user-{user_index:04d}",
        "event_id": f"synthetic-event-{event_index:07d}",
        "age": age,
        "weight_kg": weight,
        "height_cm": height,
        "workout_days_per_week": workout_days,
        "preferred_workout_duration": duration,
        "fitness_level": fitness_level,
        "primary_goal": primary_goal,
        "adherence_percentage": adherence,
        "weekly_workout_progress": weekly_progress,
        "weekly_minute_progress": minute_progress,
        "recent_sessions": recent_sessions,
        "recent_active_minutes": recent_minutes,
        "nutrition_available": int(nutrition_available),
        "calorie_percentage": calorie_percentage,
        "protein_percentage": protein_percentage,
        "readiness_score": readiness,
        "difficulty_preference": round(difficulty_preference, 2),
        "recommendation_action": action,
        "completion_probability": round(completion_probability, 4),
        "completion_label": completed,
    }


def generate_dataset(output_path, users, events_per_user, seed):
    rng = random.Random(seed)

    rows = []

    event_index = 1

    for user_index in range(1, users + 1):
        for _ in range(events_per_user):
            rows.append(
                generate_row(
                    rng,
                    user_index,
                    event_index,
                )
            )
            event_index += 1

    fieldnames = list(rows[0].keys())

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    with output.open(
        "w",
        newline="",
        encoding="utf-8",
    ) as file:
        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames,
        )
        writer.writeheader()
        writer.writerows(rows)

    completed = sum(
        row["completion_label"]
        for row in rows
    )

    print()
    print("FitZone AI Synthetic Personalization Dataset")
    print("==============================================")
    print(f"Users: {users}")
    print(f"Events: {len(rows)}")
    print(f"Completed: {completed}")
    print(f"Not completed: {len(rows) - completed}")
    print(
        f"Completion rate: "
        f"{completed / len(rows) * 100:.2f}%"
    )
    print()
    print("IMPORTANT:")
    print("This dataset is synthetic and is only for")
    print("model development/testing.")
    print()
    print(f"Saved: {output}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate synthetic FitZone personalization data."
    )

    parser.add_argument(
        "--output",
        default="ai-service/dataset/synthetic_personalization_dataset.csv",
    )

    parser.add_argument(
        "--users",
        type=int,
        default=500,
    )

    parser.add_argument(
        "--events-per-user",
        type=int,
        default=20,
    )

    parser.add_argument(
        "--seed",
        type=int,
        default=42,
    )

    args = parser.parse_args()

    if args.users < 1:
        raise ValueError("users must be at least 1")

    if args.events_per_user < 1:
        raise ValueError(
            "events-per-user must be at least 1"
        )

    generate_dataset(
        args.output,
        args.users,
        args.events_per_user,
        args.seed,
    )


if __name__ == "__main__":
    main()