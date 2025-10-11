import uuid
from pathlib import Path
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
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


from ML.llm_handler import llm_response
from app.main import get_pipeline
router = APIRouter()


@router.post(
    "/",
    response_model=schemas_analysis.Analysis,
)
async def create_analysis(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    current_user: Annotated[
        models.User | None, Depends(get_optional_current_user)
    ],
    file: UploadFile = File(...),
    recommendations: str = Form(...),
    puffiness: int = Form(...),
    dark_circles: int = Form(...),
    fatigue: int = Form(...),
    acne: int = Form(...),
    skin_condition: str = Form(...),
):

    # Получаем пайплайн и обрабатываем изображение
    pipeline = get_pipeline()
    if not pipeline:
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    # Обрабатываем изображение через пайплайн
    results = await pipeline.process_image(file)
    
    if not results:
        raise HTTPException(status_code=400, detail="No faces detected in the image")
    
    # Форматируем результаты и отправляем в LLM
    text = pipeline.print_results(results)

    llm_answer = await llm_response(text)
    parsed_text = await pipeline.parse_llm_response(llm_answer)

    rec_text = parsed_text["analysis_text"]
    diagram = parsed_text["parameters"]
    
    file_url = await storage_service.upload_file(file)

    owner_id = current_user.id if current_user else None
    analysis_in = schemas_analysis.AnalysisCreate(
        image_path=file_url,
        owner_id=owner_id,
        recommendations=recommendations,
        puffiness=puffiness,
        dark_circles=dark_circles,
        fatigue=fatigue,
        acne=acne,
        skin_condition=skin_condition,
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
