from datetime import datetime, timedelta


class SimulationClock:
    MINUTES_PER_TICK = 5

    def __init__(self, current_day: int = 1, current_time: str = "08:00"):
        self.current_day = current_day
        self.current_time = datetime.strptime(current_time, "%H:%M")

    def tick(self):
        self.current_time += timedelta(minutes=self.MINUTES_PER_TICK)
        if self.current_time.hour >= 24:
            self.current_time -= timedelta(days=1)
            self.current_day += 1

    def get_time_str(self) -> str:
        return self.current_time.strftime("%H:%M")

    def get_time_minutes(self) -> int:
        return self.current_time.hour * 60 + self.current_time.minute

    def get_state(self) -> dict:
        return {
            "current_day": self.current_day,
            "current_time": self.get_time_str(),
            "current_time_minutes": self.get_time_minutes(),
        }
