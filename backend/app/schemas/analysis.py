from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AnalysisBase(BaseModel):
    pass


class AnalysisCreate(AnalysisBase):
    image_path: str
    owner_id: int


class Analysis(AnalysisBase):
    id: int
    image_path: str
    result: dict | None
    created_at: datetime
    owner_id: int

    model_config = ConfigDict(from_attributes=True)
