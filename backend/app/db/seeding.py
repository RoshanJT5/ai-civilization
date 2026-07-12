from sqlalchemy.orm import Session

from app.db.models import (
    Agent,
    Location,
    RoutineBlock,
    WorldResource,
    SimulationSettings,
    Relationship,
)


AGENTS = [
    {
        "id": "mira",
        "name": "Mira",
        "profession": "Farmer",
        "age_stage": "adult",
        "baseline_personality": '{"traits": ["hardworking", "observant", "nurturing"]}',
        "communication_style": "practical",
        "location_id": "farm",
        "hunger": 40,
        "energy": 90,
    },
    {
        "id": "arun",
        "name": "Arun",
        "profession": "Engineer",
        "age_stage": "adult",
        "baseline_personality": '{"traits": ["analytical", "inventive", "patient"]}',
        "communication_style": "technical",
        "location_id": "workshop",
        "hunger": 45,
        "energy": 85,
    },
    {
        "id": "dev",
        "name": "Dev",
        "profession": "Teacher",
        "age_stage": "adult",
        "baseline_personality": '{"traits": ["curious", "articulate", "encouraging"]}',
        "communication_style": "educational",
        "location_id": "library",
        "hunger": 50,
        "energy": 80,
    },
    {
        "id": "sana",
        "name": "Sana",
        "profession": "Doctor",
        "age_stage": "adult",
        "baseline_personality": '{"traits": ["compassionate", "calm", "thorough"]}',
        "communication_style": "soothing",
        "location_id": "clinic",
        "hunger": 50,
        "energy": 85,
    },
    {
        "id": "rohan",
        "name": "Rohan",
        "profession": "Leader",
        "age_stage": "adult",
        "baseline_personality": '{"traits": ["decisive", "wise", "diplomatic"]}',
        "communication_style": "authoritative",
        "location_id": "town_hall",
        "hunger": 45,
        "energy": 85,
    },
    {
        "id": "kabir",
        "name": "Kabir",
        "profession": "Cook",
        "age_stage": "adult",
        "baseline_personality": '{"traits": ["warm", "generous", "social"]}',
        "communication_style": "friendly",
        "location_id": "kitchen",
        "hunger": 30,
        "energy": 80,
    },
    {
        "id": "ila",
        "name": "Ila",
        "profession": "Artist",
        "age_stage": "adult",
        "baseline_personality": '{"traits": ["creative", "sensitive", "visionary"]}',
        "communication_style": "expressive",
        "location_id": "workshop",
        "hunger": 50,
        "energy": 85,
    },
    {
        "id": "vikram",
        "name": "Vikram",
        "profession": "Logistics",
        "age_stage": "adult",
        "baseline_personality": '{"traits": ["efficient", "organized", "reliable"]}',
        "communication_style": "direct",
        "location_id": "town_hall",
        "hunger": 50,
        "energy": 90,
    },
    {
        "id": "priya",
        "name": "Priya",
        "profession": "Naturalist",
        "age_stage": "adult",
        "baseline_personality": '{"traits": ["observant", "patient", "protective"]}',
        "communication_style": "descriptive",
        "location_id": "reservoir",
        "hunger": 50,
        "energy": 85,
    },
    {
        "id": "aadi",
        "name": "Aadi",
        "profession": "Child",
        "age_stage": "child",
        "baseline_personality": '{"traits": ["curious", "imaginative", "energetic"]}',
        "communication_style": "inquisitive",
        "location_id": "library",
        "hunger": 60,
        "energy": 95,
    },
]

LOCATIONS = [
    {
        "id": "farm",
        "name": "Mira's Farm",
        "description": "Fields of crops and vegetable patches",
        "x": 150,
        "y": 400,
    },
    {
        "id": "workshop",
        "name": "Arun's Workshop",
        "description": "Workbench with tools and materials",
        "x": 500,
        "y": 100,
    },
    {
        "id": "clinic",
        "name": "Sana's Clinic",
        "description": "Clean room with medicine and supplies",
        "x": 600,
        "y": 250,
    },
    {
        "id": "library",
        "name": "Dev's Library",
        "description": "Shelves of books and learning materials",
        "x": 350,
        "y": 100,
    },
    {
        "id": "kitchen",
        "name": "Kabir's Kitchen",
        "description": "Warm hearth with cooking pots",
        "x": 350,
        "y": 400,
    },
    {
        "id": "town_hall",
        "name": "Town Hall",
        "description": "Central meeting place with Rohan's office",
        "x": 400,
        "y": 250,
    },
    {
        "id": "reservoir",
        "name": "Reservoir",
        "description": "Water reservoir and surrounding nature",
        "x": 150,
        "y": 100,
    },
]

ROUTINES = {
    "mira": [
        ("05:00", "06:30", "MORNING_ROUTINE", "kitchen"),
        ("06:30", "12:00", "FARM_WORK", "farm"),
        ("12:00", "13:00", "LUNCH", "kitchen"),
        ("13:00", "16:00", "FARM_WORK", "farm"),
        ("16:00", "18:30", "GARDENING", "farm"),
        ("18:30", "19:30", "DINNER", "kitchen"),
        ("19:30", "21:30", "SOCIALIZING", "town_hall"),
        ("21:30", "05:00", "SLEEP", "farm"),
    ],
    "arun": [
        ("07:00", "08:00", "MORNING_ROUTINE", "kitchen"),
        ("08:00", "12:00", "WORKSHOP_WORK", "workshop"),
        ("12:00", "13:00", "LUNCH", "kitchen"),
        ("13:00", "16:00", "WORKSHOP_WORK", "workshop"),
        ("16:00", "18:30", "MAINTENANCE", "workshop"),
        ("18:30", "19:30", "DINNER", "kitchen"),
        ("19:30", "22:30", "SOCIALIZING", "town_hall"),
        ("22:30", "07:00", "SLEEP", "workshop"),
    ],
    "dev": [
        ("06:30", "07:30", "MORNING_ROUTINE", "kitchen"),
        ("07:30", "12:00", "TEACHING", "library"),
        ("12:00", "13:00", "LUNCH", "kitchen"),
        ("13:00", "16:00", "TEACHING", "library"),
        ("16:00", "18:00", "RESEARCHING", "library"),
        ("18:00", "19:00", "DINNER", "kitchen"),
        ("19:00", "22:00", "SOCIALIZING", "town_hall"),
        ("22:00", "06:30", "SLEEP", "library"),
    ],
    "sana": [
        ("06:00", "07:00", "MORNING_ROUTINE", "kitchen"),
        ("07:00", "12:00", "CLINIC_HOURS", "clinic"),
        ("12:00", "13:00", "LUNCH", "kitchen"),
        ("13:00", "16:00", "CLINIC_HOURS", "clinic"),
        ("16:00", "18:30", "ORGANIZING_MEDICINE", "clinic"),
        ("18:30", "19:30", "DINNER", "kitchen"),
        ("19:30", "22:00", "SOCIALIZING", "town_hall"),
        ("22:00", "06:00", "SLEEP", "clinic"),
    ],
    "rohan": [
        ("07:30", "08:30", "MORNING_ROUTINE", "kitchen"),
        ("08:30", "12:00", "ADMIN_WORK", "town_hall"),
        ("12:00", "13:00", "LUNCH", "kitchen"),
        ("13:00", "16:00", "ADMIN_WORK", "town_hall"),
        ("16:00", "18:30", "PLANNING", "town_hall"),
        ("18:30", "19:30", "DINNER", "kitchen"),
        ("19:30", "23:00", "SOCIALIZING", "town_hall"),
        ("23:00", "07:30", "SLEEP", "town_hall"),
    ],
    "kabir": [
        ("05:30", "09:00", "BREAKFAST_SERVICE", "kitchen"),
        ("09:00", "11:00", "CLEAN_AND_PREP", "kitchen"),
        ("11:00", "13:00", "LUNCH_PREP", "kitchen"),
        ("13:00", "14:00", "REST", "kitchen"),
        ("14:00", "18:00", "EVENING_PREP", "kitchen"),
        ("18:00", "20:00", "DINNER_SERVICE", "kitchen"),
        ("20:00", "21:30", "SOCIALIZING", "town_hall"),
        ("21:30", "05:30", "SLEEP", "kitchen"),
    ],
    "ila": [
        ("08:00", "09:00", "MORNING_ROUTINE", "kitchen"),
        ("09:00", "12:00", "ART_WORK", "workshop"),
        ("12:00", "13:00", "LUNCH", "kitchen"),
        ("13:00", "16:00", "ART_WORK", "workshop"),
        ("16:00", "18:30", "OUTDOOR_SKETCHING", "reservoir"),
        ("18:30", "19:30", "DINNER", "kitchen"),
        ("19:30", "23:59", "SOCIALIZING", "town_hall"),
        ("23:59", "08:00", "SLEEP", "workshop"),
    ],
    "vikram": [
        ("06:15", "07:00", "MORNING_ROUTINE", "kitchen"),
        ("07:00", "12:00", "INVENTORY_CHECK", "town_hall"),
        ("12:00", "13:00", "LUNCH", "kitchen"),
        ("13:00", "16:00", "SUPPLY_RUNS", "farm"),
        ("16:00", "18:30", "REPORTING", "town_hall"),
        ("18:30", "19:30", "DINNER", "kitchen"),
        ("19:30", "22:15", "SOCIALIZING", "town_hall"),
        ("22:15", "06:15", "SLEEP", "town_hall"),
    ],
    "priya": [
        ("05:45", "07:00", "MORNING_ROUTINE", "kitchen"),
        ("07:00", "12:00", "FOREST_PATROL", "reservoir"),
        ("12:00", "13:00", "LUNCH", "kitchen"),
        ("13:00", "16:00", "FOREST_PATROL", "reservoir"),
        ("16:00", "18:30", "NATURE_STUDY", "reservoir"),
        ("18:30", "19:30", "DINNER", "kitchen"),
        ("19:30", "21:45", "SOCIALIZING", "town_hall"),
        ("21:45", "05:45", "SLEEP", "reservoir"),
    ],
    "aadi": [
        ("07:00", "08:00", "MORNING_ROUTINE", "kitchen"),
        ("08:00", "12:00", "LEARNING", "library"),
        ("12:00", "13:00", "LUNCH", "kitchen"),
        ("13:00", "15:00", "EXPLORATION", "farm"),
        ("15:00", "17:00", "LEARNING", "library"),
        ("17:00", "18:30", "PLAY", "reservoir"),
        ("18:30", "19:30", "DINNER", "kitchen"),
        ("19:30", "20:00", "SOCIALIZING", "town_hall"),
        ("20:00", "21:00", "NIGHTLY_REFLECTION", "library"),
        ("21:00", "07:00", "SLEEP", "library"),
    ],
}

INITIAL_RESOURCES = {
    "wood": 10,
    "tools": 2,
    "water": 100,
    "food": 50,
}

RELATIONSHIP_PAIRS = [
    ("mira", "aadi", 70, 60),
    ("mira", "kabir", 50, 50),
    ("arun", "aadi", 40, 50),
    ("arun", "vikram", 50, 50),
    ("dev", "aadi", 60, 60),
    ("sana", "priya", 40, 50),
    ("rohan", "vikram", 55, 55),
    ("kabir", "mira", 50, 50),
    ("ila", "aadi", 35, 40),
    ("priya", "sana", 40, 50),
]


def seed_database(db: Session):
    existing = db.query(SimulationSettings).first()
    if existing:
        return

    settings = SimulationSettings(
        current_day=1, current_time="08:00", weather="sunny", simulation_speed="1x"
    )
    db.add(settings)

    for loc in LOCATIONS:
        db.add(Location(**loc))

    for agent_data in AGENTS:
        db.add(Agent(**agent_data))

    for agent_id, blocks in ROUTINES.items():
        for start, end, activity, loc_id in blocks:
            db.add(
                RoutineBlock(
                    agent_id=agent_id,
                    start_time=start,
                    end_time=end,
                    activity=activity,
                    location_id=loc_id,
                )
            )

    for res_id, qty in INITIAL_RESOURCES.items():
        db.add(WorldResource(id=res_id, quantity=qty))

    for a, b, closeness, trust in RELATIONSHIP_PAIRS:
        db.add(
            Relationship(agent_a_id=a, agent_b_id=b, closeness=closeness, trust=trust)
        )

    db.commit()
