from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import models
from app.schemas.analysis import AnalysisCreate


async def create_analysis(
    db: AsyncSession, *, analysis_in: AnalysisCreate
) -> models.Analysis:
    """Create a new analysis."""
    db_obj = models.Analysis(
        image_path=analysis_in.image_path,
        owner_id=analysis_in.owner_id,
        result={"message": "Analysis in progress"},
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def get_user_analyses(
    db: AsyncSession, *, user_id: int
) -> list[models.Analysis]:
    """Get all analyses for a specific user."""
    result = await db.execute(
        select(models.Analysis).where(models.Analysis.owner_id == user_id)
    )
    return list(result.scalars().all())


async def get_analysis(db: AsyncSession, *, analysis_id: int) -> models.Analysis | None:
    """Get a single analysis by its ID."""
    result = await db.execute(
        select(models.Analysis).where(models.Analysis.id == analysis_id)
    )
    return result.scalar_one_or_none()
