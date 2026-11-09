from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class SlotInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    provider: str = Field(min_length=1)
    start: datetime
    end: datetime

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.start.tzinfo is None or self.end.tzinfo is None:
            raise ValueError("Slot timestamps must include a timezone")

        if self.end <= self.start:
            raise ValueError("Slot end must be after start")

        return self


class ResetRequest(BaseModel):
    slots: list[SlotInput]


class SlotResponse(SlotInput):
    available: bool


class SlotsResponse(BaseModel):
    slots: list[SlotResponse]
