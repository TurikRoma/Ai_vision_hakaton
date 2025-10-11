from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AnalysisBase(BaseModel):
    recommendations: str | None = None
    puffiness: int | None = None
    dark_circles: int | None = None
    fatigue: int | None = None
    acne: int | None = None
    skin_condition: str | None = None


class AnalysisCreate(BaseModel):
    image_path: str
    owner_id: int | None = None


class AnalysisUpdate(AnalysisBase):
    pass


class Analysis(AnalysisBase):
    id: int
    image_path: str
    created_at: datetime
    owner_id: int | None

    model_config = ConfigDict(from_attributes=True)
