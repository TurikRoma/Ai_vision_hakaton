import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import (
    api_key_auth,
    get_current_user,
    get_db_session,
    get_optional_current_user,
)
from app.crud import analysis as crud_analysis
from app.db import models
from app.schemas import analysis as schemas_analysis
from app.services.storage import storage_service

router = APIRouter()


@router.post(
    "/",
    response_model=schemas_analysis.Analysis,
    dependencies=[Depends(api_key_auth)],
)
async def create_analysis(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    current_user: Annotated[
        models.User | None, Depends(get_optional_current_user)
    ],
    file: UploadFile = File(...),
):
    """
    Upload a file for analysis.
    """
    file_url = await storage_service.upload_file(file)

    owner_id = current_user.id if current_user else None
    analysis_in = schemas_analysis.AnalysisCreate(
        image_path=file_url, owner_id=owner_id
    )
    analysis = await crud_analysis.create_analysis(db, analysis_in=analysis_in)
    return analysis


@router.get("/", response_model=list[schemas_analysis.Analysis])
async def read_analyses(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    current_user: Annotated[models.User, Depends(get_current_user)],
):
    """
    Retrieve all analyses for the current user.
    """
    analyses = await crud_analysis.get_user_analyses(db, user_id=current_user.id)
    return analyses


@router.get("/{analysis_id}", response_model=schemas_analysis.Analysis)
async def read_analysis(
    analysis_id: int,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    current_user: Annotated[models.User, Depends(get_current_user)],
):
    """
    Retrieve a specific analysis by its ID.
    """
    analysis = await crud_analysis.get_analysis(db, analysis_id=analysis_id)
    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found"
        )
    if analysis.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this analysis",
        )
    return analysis


@router.patch("/{analysis_id}", response_model=schemas_analysis.Analysis)
async def update_analysis(
    analysis_id: int,
    analysis_in: schemas_analysis.AnalysisUpdate,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    # TODO: Add security check, e.g. internal service key
):
    """
    Update an analysis with results.
    """
    db_analysis = await crud_analysis.get_analysis(db, analysis_id=analysis_id)
    if not db_analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    updated_analysis = await crud_analysis.update_analysis(
        db, db_obj=db_analysis, obj_in=analysis_in
    )
    return updated_analysis


@router.patch(
    "/{analysis_id}/assign", response_model=schemas_analysis.Analysis
)
async def assign_analysis_to_user(
    analysis_id: int,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    current_user: Annotated[models.User, Depends(get_current_user)],
):
    """
    Assign an anonymous analysis to the current user.
    """
    analysis = await crud_analysis.get_analysis(db, analysis_id=analysis_id)
    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found"
        )
    if analysis.owner_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Analysis is already assigned to a user",
        )

    analysis.owner_id = current_user.id
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)

    return analysis
